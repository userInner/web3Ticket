import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext'
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ChakraProvider, extendTheme } from '@chakra-ui/react'; // 导入 ChakraProvider

// 1. 创建一个自定义主题 (可选，但推荐用于 Web3 风格)
const theme = extendTheme({
  config: {
    initialColorMode: 'dark', // 默认深色模式
    useSystemColorMode: false,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.50',
        color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800',
      },
    }),
  },
  colors: {
    brand: { // 自定义品牌色
      50: '#e6f7ff',
      100: '#bae7ff',
      200: '#91d5ff',
      300: '#69c0ff',
      400: '#40a9ff',
      500: '#1890ff', // 主品牌色
      600: '#096dd9',
      700: '#0050b3',
      800: '#003a8c',
      900: '#002766',
    },
    // 可以添加更多 Web3 风格的颜色，如霓虹色、渐变色相关的基础色
    neonPink: '#FF00E5',
    cyberPurple: '#7B00FF',
  },
  fonts: {
    heading: `'Inter', sans-serif`, // 使用现代无衬线字体
    body: `'Inter', sans-serif`,
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg', // 更圆润的按钮
      },
      variants: {
        solid: (props) => ({
          bg: props.colorMode === 'dark' ? 'brand.500' : 'brand.500',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? 'brand.600' : 'brand.600',
          },
        }),
        outline: (props) => ({
          borderColor: 'brand.500',
          color: props.colorMode === 'dark' ? 'brand.200' : 'brand.500',
          _hover: {
            bg: props.colorMode === 'dark' ? 'brand.500_10' : 'brand.50_10', // 半透明背景
          }
        }),
        // 可以添加霓虹效果的按钮变体
        neon: (props) => ({
          bgGradient: 'linear(to-r, neonPink, cyberPurple)',
          color: 'white',
          _hover: {
            opacity: 0.8,
          },
          boxShadow: `0 0 15px 2px var(--chakra-colors-neonPink), 0 0 15px 2px var(--chakra-colors-cyberPurple)`,
        }),
      },
    },
    // 可以为其他组件如 Card, Input, Text 等定义基础样式
    Container: {
      baseStyle: {
        w: '100%', // 确保容器尝试占据100%的父容器宽度
        maxW: 'container.lg', // 限制内容最大宽度
        mx: 'auto', // 水平居中
        px: { base: 4, md: 6 }, // 明确为水平内边距 (padding-left 和 padding-right)
      },
    },
    Heading: {
      baseStyle: (props) => ({
        color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.700',
      }),
    },
    Text: {
      baseStyle: (props) => ({
        color: props.colorMode === 'dark' ? 'whiteAlpha.800' : 'gray.600',
      }),
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary> {/* 包裹 AppProvider 和 App */}
      <ChakraProvider theme={theme}> {/* 使用 ChakraProvider 并传入主题 */}
        <AppProvider> {/* AppContext 仍然需要 */}
          <App />
        </AppProvider>
      </ChakraProvider>
    </ErrorBoundary>
  </StrictMode>
)
