import type { NextPage } from 'next';
import Box from '@mui/material/Box';
import ImageEditor from 'components/ImageEditor';



const Home: NextPage = () => {
  console.log(process.env.NEXT_PUBLIC_HOST);
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
      <ImageEditor host={process.env.NEXT_PUBLIC_HOST as string} />
    </Box>
  );
};

export default Home;