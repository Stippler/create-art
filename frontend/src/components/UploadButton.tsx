import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Stack from '@mui/material/Stack';
import { Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import Box from '@mui/system/Box';

interface Props {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input = styled('input')({
    display: 'none',
});

export default function UploadButton({ onChange }: Props) {

    return (
        <label htmlFor="contained-button-file">
            <Input
                accept="image/*"
                id="contained-button-file"
                multiple type="file"
                onChange={onChange}
            />
            <Button variant="contained" component="span" fullWidth>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <PhotoCamera />
                    <Typography>Upload</Typography>
                </Stack>
            </Button>
        </label>
    );
}