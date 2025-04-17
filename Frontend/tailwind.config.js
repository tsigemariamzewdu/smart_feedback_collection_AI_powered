/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		fontFamily: {
		poppins: ["Poppins", "sans-serif"], // Custom font
		},
		fontSize:{
			"base":"20px",
			"navheader":"32px",
		},

  		colors: {
			primary: '#B21589',
			plight: '#F7E8F3',
			textgray: '#A2A1A8',
			textblack: '#16151C',
			tableHeader:"#e6eef8",
			success: "#28a745",
			successLight: "#c1f1cb",
			error: "#dc3545",
			errorLight: "#fccfcf",
			warning: "#6d23de",
			warningLight: "#ede8ff",
			accent: '#34D399',
			headingText: '#F3F4F6',
			bodyText: '#808080',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: '#5B8FAA',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: '#F7E8F3',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
		  container: {
			center: true, // Centers the container
			padding: {
			  DEFAULT: '1rem', // Default padding for all screen sizes
			  sm: '2rem', // Padding for small screens
			  lg: '4rem', // Padding for large screens
			  xl: '5rem', // Padding for extra-large screens
			  '2xl': '6rem', // Padding for 2xl screens
			},
			screens: {
			  sm: '640px',
			  md: '768px',
			  lg: '1024px',
			  xl: '1280px',
			  '2xl': '1536px',  
			},
		  },
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

