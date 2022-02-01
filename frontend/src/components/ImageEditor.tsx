import { PhotoCamera } from "@mui/icons-material";
import { Button, CircularProgress, Grow, Slider, TextField, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import React, { useEffect, useState } from "react";
import UploadButton from "./UploadButton";
import Image from 'next/image'
import Box from "@mui/system/Box";

interface StyleMix {
    name: string,
    weight: number,
    layerWeights: number[]
}

export default function ImageEditor() {
    const [id, setId] = useState<string | null>(null);
    const [projected, setProjected] = useState<boolean>(false);
    const [steps, setSteps] = useState<number>(10);
    const [loading, setLoading] = useState<boolean>(false)


    const [mix, setMix] = useState<StyleMix[]>([
        {
            name: 'FFHQ',
            weight: 1.0,
            layerWeights: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        },
        {
            name: 'Cartoon',
            weight: 1.0,
            layerWeights: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        },
        {
            name: 'Portrait',
            weight: 1.0,
            layerWeights: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        },
    ]);


    if (loading) {
        return (
            <Box sx={{ display: 'flex' }}>
                <CircularProgress />
            </Box>
        )
    }

    const project = (id: string, steps: number) => {
        console.log('start projecting');
        fetch(`http://127.0.0.1:5000/api/project/${id}`, {
            method: 'POST',
            body: JSON.stringify({ steps: steps })
        }).then(resp => resp)
            .then(resp => {
                console.log(resp);
                setProjected(true);
            })
            .catch(resp => {
                console.log(resp);
            });
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        console.log('send file')
        const fileList = e.target.files;
        console.log(fileList);
        if (fileList != null && fileList.length > 0) {
            const formData = new FormData();
            formData.append('image', fileList[0]);
            setLoading(true);
            fetch(`http://127.0.0.1:5000/api/upload`, {
                method: 'POST',
                body: formData
            }).then(resp => resp.json())
                .then(resp => {
                    console.log(resp);
                    setLoading(false);
                    setId(resp.id);
                    project(resp.id, 10);
                })
                .catch(resp => {
                    setLoading(false);
                    console.log(resp);
                });
        }
    };

    if (!id) {
        return (
            <UploadButton onChange={handleChange} />
        );
    }


    const uploadMix = () => {
        fetch(`http://127.0.0.1:5000/api/mix/${id}`, {
            method: 'POST',
            body: JSON.stringify({
                weights: mix.map(style => style.weight),
                layerWeights: mix.map(style => style.layerWeights)
            })
        }).then(resp => resp)
            .then(resp => {
                console.log(resp)
            })
            .catch(resp => {
                console.log(resp);
            });
    };



    const sliders = mix.map((style, i) =>
        <Grid item xs={4} key={i}>
            <Grid container spacing={1}>
                <Grid item xs={12}>
                    <Typography variant="h5">
                        {style.name}
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Slider
                        step={0.01}
                        min={0.0}
                        max={1.0}
                        value={style.weight}
                        aria-label="Default"
                        onChange={(e, val) => {
                            val = val as number;
                            if (val !== style.weight) {
                                let newMix = [...mix];
                                newMix[i].weight = val;
                                setMix(newMix);
                                uploadMix();
                            }
                        }}
                        valueLabelDisplay="auto"
                    />
                </Grid>
                {style.layerWeights.map((weight, j) =>
                    <Grid item xs={12} key={j}>
                        <Grid container>
                            <Grid item xs={12}>
                                <Typography>
                                    Layer {j + 1}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Slider
                                    step={0.01}
                                    min={0.0}
                                    max={1.0}
                                    value={weight}
                                    size="small"
                                    aria-label="Small"
                                    onChange={(e, val) => {
                                        val = val as number;
                                        if (val !== weight) {
                                            let newMix = [...mix];
                                            newMix[i].layerWeights[j] = val;
                                            setMix(newMix);
                                            uploadMix();
                                        }
                                    }}
                                    valueLabelDisplay="auto"
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                )}
            </Grid>
        </Grid>
    );

    const buttons = (
        <Paper
            elevation={3}
            sx={{
                padding: 2
            }}>
            <Grid item xs={12}>
                <Grid container spacing={3}>
                    <Grid item xs={6}>
                        <UploadButton onChange={handleChange} />
                    </Grid>
                    <Grid item xs={6}>
                        <Button variant="contained" fullWidth disabled={isNaN(steps) || steps < 10} onClick={() => {
                            const link = document.createElement("a");
                            link.download = `${id}.jpg`;
                            link.href = `http://127.0.0.1:5000/api/download/${id}`;
                            link.click();
                        }}>
                            Download
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            id="outlined-number"
                            label="Steps"
                            type="number"
                            size="small"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            value={steps}
                            onChange={(e) => {
                                const num = parseInt(e.target.value);
                                setSteps(num);
                            }}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <Button variant="contained" fullWidth disabled={isNaN(steps) || steps < 10} onClick={() => {
                            setProjected(false);
                            project(id, steps);
                        }}>
                            Recalibrate
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </Paper >
    );

    const stream = (
        <Paper
            elevation={3}
            sx={{
                padding: 2
            }}>
            <Grid container spacing={3}>
                <Grid item md={6} xs={12}>
                    <img src={`http://localhost:5000/api/face/${id}`} alt="image stream" width='100%' height='auto' />
                </Grid>
                <Grid item md={6} xs={12}>
                    <img src={`http://localhost:5000/api/stream/${id}`} alt="image stream" width='100%' height='auto' />
                </Grid>
            </Grid>
        </Paper>
    );

    const slidersView = (
        <Paper
            elevation={3}
            sx={{
                padding: 2
            }}>
            <Grid container justifyContent='center' spacing={2}>
                {sliders}
            </Grid>
        </Paper>
    );

    return (
        <>
            <Grow in={!loading}>{stream}</Grow>
            <br />
            <Grow in={projected}>{buttons}</Grow>
            <br />
            <Grow in={!loading}
                style={{ transformOrigin: '0 0 0' }}
                {...(!loading ? { timeout: 1000 } : {})}
            >
                {slidersView}
            </Grow>
        </>
    );
}