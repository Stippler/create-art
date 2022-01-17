import numpy as np
from utils.projector import Projector
import legacy
import dnnlib
import torch
import copy
import cv2
from PIL import Image
from utils.blender import Blender
from utils.align import FaceDetector
import warnings
warnings.filterwarnings('ignore')


class FaceWorker:
    def __init__(self):
        self.face_detector = FaceDetector()

    def extract_face(self, img_pil):
        faces = self.face_detector.extract_faces(img_pil)
        if len(faces) > 0:
            return True, faces[0]
        else:
            return False, None

    def pil_to_bytes(self, img_pil):
        img = np.asarray(img_pil)
        _, frame = cv2.imencode('.jpg', img_pil)
        return frame.tobytes()


device = torch.device('cuda')


class ProjectorWorker:

    def __init__(self):
        f = dnnlib.util.open_url('pickels/ffhq.pkl')
        G = legacy.load_network_pkl(f)['G_ema'].to(device)
        self.projector = Projector(G, device)

    def run_projection(self, target_pil, num_steps=1000):
        return self.run_projection(target_pil, num_steps)


base_path = 'data/pickels/ffhq.pkl'
styles = ['data/pickels/cartoon.pkl', 'data/pickels/metfaces.pkl']

G_kwargs = dnnlib.EasyDict()
f = dnnlib.util.open_url(base_path)
model = legacy.load_network_pkl(f, **G_kwargs)['G_ema']  # type: ignore
base = model
base.to(device)
styles = [base]

for style_path in []:
    f = dnnlib.util.open_url(style_path)
    model = legacy.load_network_pkl(f, **G_kwargs)['G_ema']  # type: ignore
    model.to(device)
    styles.append(model)


class StyleWorker:
    def __init__(self):
        self.blender = Blender(copy.deepcopy(base), styles)

    def generate(self, latent_vector, mix):
        self.blender.blend_models(mix)
        img = self.blender.generate(latent_vector)
        return img

    def generate_pil(self, latent_vector, mix):
        self.blender.blend_models(mix)
        img = self.blender.generate(latent_vector)
        return Image.fromarray(img).convert('RGB')

    def generate_bytes(self, latent_vector, mix):
        img = self.generate(latent_vector, mix)
        _, frame = cv2.imencode('.jpg', cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
        return frame.tobytes()

