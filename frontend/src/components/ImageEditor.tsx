import { PhotoCamera } from "@mui/icons-material";
import { Button, Slider, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import styled from "@mui/styled-engine";
import Box from "@mui/system/Box";
import React, { useEffect, useState } from "react";
import { MySlider } from "./Slider";
import UploadButton from "./UploadButton";

interface StyleMix {
    name: string,
    weight: number,
    layerWeights: number[]
}

export default function ImageEditor() {
    const [id, setId] = useState<string | null>(null);



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


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        console.log('send file')
        const fileList = e.target.files;
        console.log(fileList);
        if (fileList != null && fileList.length > 0) {
            const formData = new FormData();
            formData.append('image', fileList[0]);
            fetch(`http://127.0.0.1:5000/api/upload`, {
                method: 'POST',
                body: formData
            }).then(resp => resp.json())
                .then(resp => {
                    console.log(resp);
                    setId(resp.id);
                })
                .catch(resp => {
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
                    <Typography>
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
                )}
            </Grid>
        </Grid>
    );

    return (
        <>
            <Paper
                elevation={3}
                sx={{
                    padding: 2
                }}>
                <img src={`http://localhost:5000/api/stream/${id}`} alt="image stream" width="512" height="512" />
            </Paper>
            <br />
            <Paper
                elevation={3}
                sx={{
                    padding: 2
                }}>
                <Grid container spacing={2} justifyContent='space-between'>
                    <Grid item xs={6}>
                        <img src={`http://127.0.0.1:5000/api/face/${id}`} alt="base image" width="256" height="256" />
                    </Grid>
                    <Grid item xs={6}>
                        <img src={`http://127.0.0.1:5000/api/face/${id}`} alt="base image" width="256" height="256" />
                    </Grid>
                </Grid>
            </Paper>
            <br />
            <Paper
                elevation={3}
                sx={{
                    padding: 2
                }}>
                <Grid container justifyContent='center' spacing={3}>
                    <Grid item xs={12}>
                        <UploadButton onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container spacing={3}>
                            {sliders}
                        </Grid>
                    </Grid>
                </Grid>
            </Paper>
        </>
    );
}