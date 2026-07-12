import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Snackbar from '@mui/material/Snackbar';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#bf7045', // warm copper
    },
    background: {
      default: '#141616',
      paper: 'rgba(29, 32, 32, 0.45)',
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Sora', sans-serif" },
    h2: { fontFamily: "'Sora', sans-serif" },
    h3: { fontFamily: "'Sora', sans-serif" },
    h4: { fontFamily: "'Sora', sans-serif" },
    h5: { fontFamily: "'Sora', sans-serif" },
    h6: { fontFamily: "'Sora', sans-serif" },
  },
});

export default function Authentication() {
    const { handleRegister, handleLogin } = React.useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState();
    const [message, setMessage] = React.useState("");

    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
      if (location.state && location.state.formState !== undefined) {
        setFormState(location.state.formState);
      }
    }, [location.state]);

    React.useEffect(() => {
      const token = localStorage.getItem("token");
      if (token) {
        navigate("/home");
      }
    }, [navigate]);

    let handleAuth = async () => {
      try {
        if(formState === 0) {
          await handleLogin(username, password);
          navigate("/home");
        }
        if(formState === 1) {
          let result = await handleRegister(name, username, password);
          setUsername("");
          setName("");
          setMessage(result);
          setOpen(true);
          setError("");
          setFormState(0);
          setPassword("");
        }
      } catch (err) {
        let message = (err.response?.data?.message || err.message);
        setError(message);
      }
    }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 50%, #242422 0%, #141616 100%)',
          padding: '20px',
        }}
      >
        <Box
          component={Paper}
          elevation={24}
          sx={{
            padding: { xs: '30px 20px', sm: '40px' },
            width: '100%',
            maxWidth: '460px',
            borderRadius: '24px',
            background: 'rgba(29, 32, 32, 0.65)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4), 0 0 40px rgba(191, 112, 69, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <Avatar 
            sx={{ 
              m: 1, 
              background: 'linear-gradient(135deg, #8c7853 0%, #bf7045 100%)',
              boxShadow: '0 8px 20px rgba(191, 112, 69, 0.15)',
              width: 56,
              height: 56
            }}
          >
            <LockOutlinedIcon />
          </Avatar>

          <Typography 
            component="h1" 
            variant="h4" 
            sx={{ 
              fontWeight: 800, 
              background: 'linear-gradient(to right, #ffffff, #d48b61)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}
          >
            {formState === 0 ? "Welcome Back" : "Create Account"}
          </Typography>

          <Box 
            sx={{ 
              display: 'flex', 
              width: '100%', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '50px', 
              padding: '4px',
              border: '1px solid rgba(255,255,255,0.03)'
            }}
          >
            <Button 
              onClick={() => {
                setFormState(0);
                setUsername("");
                setPassword("");
                setName("");
                setError("");
              }}
              sx={{
                flex: 1,
                borderRadius: '50px',
                color: formState === 0 ? '#fff' : '#9ca3af',
                background: formState === 0 ? 'rgba(255,255,255,0.08)' : 'transparent',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: formState === 0 ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                '&:hover': {
                  background: formState === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                }
              }}
            >
              Sign In
            </Button>
            <Button 
              onClick={() => {
                setFormState(1);
                setUsername("");
                setPassword("");
                setName("");
                setError("");
              }}
              sx={{
                flex: 1,
                borderRadius: '50px',
                color: formState === 1 ? '#fff' : '#9ca3af',
                background: formState === 1 ? 'rgba(255,255,255,0.08)' : 'transparent',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: formState === 1 ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                '&:hover': {
                  background: formState === 1 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                }
              }}
            >
              Sign Up
            </Button>
          </Box>

          <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
            {formState === 1 && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                InputProps={{
                  style: {
                    color: 'white',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '14px',
                  }
                }}
                sx={{
                  '& label.Mui-focused': { color: '#bf7045' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.05)' },
                    '&:hover fieldset': { borderColor: 'rgba(191,112,69,0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#bf7045' },
                  }
                }}
              />
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                style: {
                  color: 'white',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '14px',
                }
              }}
              sx={{
                '& label.Mui-focused': { color: '#bf7045' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.05)' },
                  '&:hover fieldset': { borderColor: 'rgba(191,112,69,0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#bf7045' },
                }
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              value={password}
              type="password"
              id="password"
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                style: {
                  color: 'white',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '14px',
                }
              }}
              sx={{
                '& label.Mui-focused': { color: '#bf7045' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.05)' },
                  '&:hover fieldset': { borderColor: 'rgba(191,112,69,0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#bf7045' },
                }
              }}
            />
           
            {error && (
              <Typography sx={{ color: '#ef4444', fontSize: '14px', mt: 1, textAlign: 'center', fontWeight: 500 }}>
                {error}
              </Typography>
            )}

            <Button
              type="button"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2,
                borderRadius: '14px',
                padding: '12px',
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #8c7853 0%, #bf7045 100%)',
                boxShadow: '0 8px 24px rgba(191, 112, 69, 0.15)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #706042 0%, #a65d35 100%)',
                  boxShadow: '0 10px 28px rgba(191, 112, 69, 0.25)',
                }
              }} 
              onClick={handleAuth}
            >
              {formState === 0 ? "Login" : "Register"}
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        message={message}
        onClose={() => setOpen(false)}
      />
    </ThemeProvider>
  );
}