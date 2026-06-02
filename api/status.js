export default function handler(_request, response) {
  response.status(200).json({
    modules: [
      {
        id: 'socios',
        path: '/area/socios',
        online: true,
        status: 'integrado',
      },
      {
        id: 'utentes',
        path: '/area/utentes',
        online: true,
        status: 'integrado',
      },
      {
        id: 'dispositivos',
        path: '/area/dispositivos',
        online: true,
        status: 'integrado',
      },
    ],
  })
}
