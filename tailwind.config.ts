import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(transparent 270deg, white, transparent)',
  			'green-background': "url('../public/mainBackground.avif')"
  		},
  		fontFamily: {
  			'custom-font': [
  				'Open Sans',
  				'sans-serif'
  			]
  		},
  		colors: {
  			textBox: '#e2e8f0',
  			downloadBox: '#D7D7D7',
  			downloadBoxOnHover: '#c1c1c1',
  			landingPage: '#1e293b',
			chatDark: '#283548',
			textDark: '#EDEDED',
			btnDark: '#6366F1',
			btnDarkHover: '#4F46E5',
			userChatBg: '#32425A',
			codeBgDark: '#1E2A3A',
  			hoverLandingPage: '#020617',
  			error: '#FF4D4D',
  			launch: '#2F405D',
  			landingPageLight: '#eeece2',
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
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
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
  		height: {
  			chatbox: '45rem',
  			chatHistoryBox: '45rem'
  		},
  		maxWidth: {
  			'256': '256px'
  		},
  		keyframes: {
  			marquee: {
  				from: {
  					transform: 'translateX(0)'
  				},
  				to: {
  					transform: 'translateX(calc(-100% - var(--gap)))'
  				}
  			},
  			'marquee-vertical': {
  				from: {
  					transform: 'translateY(0)'
  				},
  				to: {
  					transform: 'translateY(calc(-100% - var(--gap)))'
  				}
  			},
  			'fade-in': {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
			'rainbow': {
                "0%" : {
                    "background-position": "0%",
                },
                "100%": {
                    "background-position": "200%",
                },
            },
			'bubble-on': {
				'0%': { transform: 'translateX(0px) scale(1)' },
				'50%': { transform: 'translateX(10px) scaleX(1.25)' },
				'100%': { transform: 'translateX(20px) scale(1)' },
			},
			'bubble-off': {
				'0%': { transform: 'translateX(20px) scale(1)' },
				'50%': { transform: 'translateX(10px) scaleX(1.25)' },
				'100%': { transform: 'translateX(0px) scale(1)' },
			},
			"shimmer-slide": {
				to: {
					transform: "translate(calc(100cqw - 100%), 0)",
				},
			},
			"spin-around": {
				"0%": {
					transform: "translateZ(0) rotate(0)",
				},
				"15%, 35%": {
					transform: "translateZ(0) rotate(90deg)",
				},
				"65%, 85%": {
					transform: "translateZ(0) rotate(270deg)",
				},
				"100%": {
					transform: "translateZ(0) rotate(360deg)",
				},
			},
		"shine": {
			"0%": { left: "-100%" },
			"100%": { left: "100%" },
		},
		'slide-down': {
			'0%': { transform: 'translate(-50%, -100%)', boxShadow: 'none' },
			'100%': { transform: 'translate(-50%, 0)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
		},

  		},
  		animation: {
  			marquee: 'marquee var(--duration) linear infinite',
  			'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
  			'fade-in': 'fade-in 1s ease-in-out forwards',
  			'fade-in-sm': 'fade-in 0.15s ease-out forwards',
			'rainbow': "rainbow 2s linear infinite",
			'bubble-on': 'bubble-on 0.2s ease-in-out forwards',
			'bubble-off': 'bubble-off 0.2s ease-in-out forwards',
			'shimmer-slide': 'shimmer-slide var(--speed, 3s) ease-in-out infinite alternate',
        	'spin-around': 'spin-around calc(var(--speed, 3s) * 2) infinite linear',
			 "shine": "shine 3s infinite",
		 	'slide-down': 'slide-down 0.3s ease-in-out forwards',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
