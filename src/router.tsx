import { createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { Playground } from './pages/Playground'
import { Reference } from './pages/Reference'
import { TopicPage } from './pages/TopicPage'
import { Topics } from './pages/Topics'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'topics', element: <Topics /> },
      { path: 'topics/:topicId', element: <TopicPage /> },
      // ?step=N opens the run at step N.
      { path: 'playground/:scenarioId?', element: <Playground /> },
      { path: 'reference/:kind?', element: <Reference /> },
      { path: '*', element: <NotFound /> },
    ],
  },
], { basename: import.meta.env.BASE_URL })
