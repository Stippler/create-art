from time import perf_counter
import copy
from time import perf_counter
import numpy as np
import PIL.Image
import torch
import torch.nn.functional as F
import dnnlib
import torch.nn.functional as F
import copy
from tqdm.auto import tqdm
import legacy

class Projector:
    def __init__(self, G, device):
        G = copy.deepcopy(G).eval().requires_grad_(False).to(device) # type: ignore
        self.G = G
        # Load VGG16 feature detector.
        url = 'data/pickels/metrics/vgg16.pt'
        f =  dnnlib.util.open_url(url)
        self.vgg16 = torch.jit.load(f).eval().to(device)
        self.device = device

    def project(
        self,
        G,
        target: torch.Tensor, # [C,H,W] and dynamic range [0,255], W & H must match G output resolution
        *,
        num_steps                  = 1000,
        w_avg_samples              = 10000,
        initial_learning_rate      = 0.1,
        initial_noise_factor       = 0.05,
        lr_rampdown_length         = 0.25,
        lr_rampup_length           = 0.05,
        noise_ramp_length          = 0.75,
        regularize_noise_weight    = 1e5,
        device: torch.device
    ):
        assert target.shape == (G.img_channels, G.img_resolution, G.img_resolution)

        # Compute w stats.
        z_samples = np.random.RandomState(123).randn(w_avg_samples, G.z_dim)
        w_samples = G.mapping(torch.from_numpy(z_samples).to(device), None)  # [N, L, C]
        w_samples = w_samples[:, :1, :].cpu().numpy().astype(np.float32)       # [N, 1, C]
        w_avg = np.mean(w_samples, axis=0, keepdims=True)      # [1, 1, C]
        w_std = (np.sum((w_samples - w_avg) ** 2) / w_avg_samples) ** 0.5

        # Setup noise inputs.
        noise_bufs = { name: buf for (name, buf) in G.synthesis.named_buffers() if 'noise_const' in name }


        # Features for target image.
        target_images = target.unsqueeze(0).to(device).to(torch.float32)
        if target_images.shape[2] > 256:
            target_images = F.interpolate(target_images, size=(256, 256), mode='area')
        target_features = self.vgg16(target_images, resize_images=False, return_lpips=True)

        w_opt = torch.tensor(w_avg, dtype=torch.float32, device=device, requires_grad=True) # pylint: disable=not-callable
        optimizer = torch.optim.Adam([w_opt] + list(noise_bufs.values()), betas=(0.9, 0.999), lr=initial_learning_rate)

        # Init noise.
        for buf in noise_bufs.values():
            buf[:] = torch.randn_like(buf)
            buf.requires_grad = True

        pbar = tqdm(range(num_steps))
        pbar.set_description('Finding Latent Vector')
        for step in pbar:
            # Learning rate schedule.
            t = step / num_steps
            w_noise_scale = w_std * initial_noise_factor * max(0.0, 1.0 - t / noise_ramp_length) ** 2
            lr_ramp = min(1.0, (1.0 - t) / lr_rampdown_length)
            lr_ramp = 0.5 - 0.5 * np.cos(lr_ramp * np.pi)
            lr_ramp = lr_ramp * min(1.0, t / lr_rampup_length)
            lr = initial_learning_rate * lr_ramp
            for param_group in optimizer.param_groups:
                param_group['lr'] = lr

            # Synth images from opt_w.
            w_noise = torch.randn_like(w_opt) * w_noise_scale
            ws = (w_opt + w_noise).repeat([1, G.mapping.num_ws, 1])
            synth_images = G.synthesis(ws, noise_mode='const')

            # Downsample image to 256x256 if it's larger than that. VGG was built for 224x224 images.
            synth_images = (synth_images + 1) * (255/2)
            if synth_images.shape[2] > 256:
                synth_images = F.interpolate(synth_images, size=(256, 256), mode='area')

            # Features for synth images.
            synth_features = self.vgg16(synth_images, resize_images=False, return_lpips=True)
            dist = (target_features - synth_features).square().sum()

            # Noise regularization.
            reg_loss = 0.0
            for v in noise_bufs.values():
                noise = v[None,None,:,:] # must be [1,1,H,W] for F.avg_pool2d()
                while True:
                    reg_loss += (noise*torch.roll(noise, shifts=1, dims=3)).mean()**2
                    reg_loss += (noise*torch.roll(noise, shifts=1, dims=2)).mean()**2
                    if noise.shape[2] <= 8:
                        break
                    noise = F.avg_pool2d(noise, kernel_size=2)
            loss = dist + reg_loss * regularize_noise_weight

            # Step
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            optimizer.step()

            # Save projected W for each optimization step.
            yield w_opt.detach()[0].cpu().numpy()

            # Normalize noise.
            with torch.no_grad():
                for buf in noise_bufs.values():
                    buf -= buf.mean()
                    buf *= buf.square().mean().rsqrt()

    def run_projection(self, target_pil, num_steps=1000):
        """
        Projects a given image into latent space
        """

        target_uint8 = np.array(target_pil, dtype=np.uint8)

        # Optimize projection.
        return self.project(
            self.G,
            target=torch.tensor(target_uint8.transpose([2, 0, 1]), device=self.device), # pylint: disable=not-callable
            num_steps=num_steps,
            device=self.device,
            verbose=True
        )