
export default [
  {
    path: '/',
    component: () => import('layouts/default'),
    children: [
      {path:'messages/:idOrName', name:'messages', component: ()=>import('pages/messages')},
      { path: '', name:'index', component: () => import('pages/index') }
    ]
  },

  { // Always leave this as last one
    path: '*',
    component: () => import('pages/404')
  }
]
