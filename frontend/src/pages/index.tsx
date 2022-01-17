import type { NextPage } from 'next';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from 'components/Link';
import ProTip from 'components/ProTip';
import Copyright from 'components/Copyright';
import { Grid, Paper } from '@mui/material';
import React from 'react';
import { MySlider } from 'components/Slider';
import UploadButton from 'components/UploadButton';
import ImageEditor from 'components/ImageEditor';

const Home: NextPage = () => {
  return (
    <Box
      sx={{
        my: 4,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Style Transfer: Create Art
      </Typography>
      <ImageEditor />
      <Copyright />
    </Box>
  );
};

export default Home;