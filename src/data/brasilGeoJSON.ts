// GeoJSON dos estados brasileiros com coordenadas mais precisas
// Coordenadas em [longitude, latitude]
export const BRASIL_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { estado: 'RR', nome: 'Roraima' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-67.85, 1.19], [-59.56, 1.19], [-59.56, 5.27], [-67.85, 5.27], [-67.85, 1.19]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'AP', nome: 'Amapá' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-54.80, 0.90], [-48.38, 0.90], [-48.38, 3.90], [-54.80, 3.90], [-54.80, 0.90]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'AM', nome: 'Amazonas' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-74.23, -0.04], [-59.79, -0.04], [-59.79, -5.30], [-74.23, -5.30], [-74.23, -0.04]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'PA', nome: 'Pará' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-60.21, 2.46], [-49.64, 2.46], [-49.64, -4.75], [-60.21, -4.75], [-60.21, 2.46]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'AC', nome: 'Acre' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-73.98, -4.24], [-71.99, -4.24], [-71.99, -10.99], [-73.98, -10.99], [-73.98, -4.24]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'RO', nome: 'Rondônia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-65.54, -8.76], [-59.88, -8.76], [-59.88, -13.78], [-65.54, -13.78], [-65.54, -8.76]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'MT', nome: 'Mato Grosso' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-60.67, -7.52], [-50.55, -7.52], [-50.55, -18.50], [-60.67, -18.50], [-60.67, -7.52]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'MA', nome: 'Maranhão' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-46.43, -1.07], [-42.80, -1.07], [-42.80, -10.36], [-46.43, -10.36], [-46.43, -1.07]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'TO', nome: 'Tocantins' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-50.73, -4.98], [-48.00, -4.98], [-48.00, -10.82], [-50.73, -10.82], [-50.73, -4.98]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'GO', nome: 'Goiás' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-54.26, -12.22], [-48.10, -12.22], [-48.10, -19.50], [-54.26, -19.50], [-54.26, -12.22]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'DF', nome: 'Distrito Federal' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-48.48, -15.50], [-47.31, -15.50], [-47.31, -16.05], [-48.48, -16.05], [-48.48, -15.50]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'MS', nome: 'Mato Grosso do Sul' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-57.57, -19.03], [-54.62, -19.03], [-54.62, -23.00], [-57.57, -23.00], [-57.57, -19.03]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'PI', nome: 'Piauí' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-45.29, -2.73], [-41.15, -2.73], [-41.15, -10.90], [-45.29, -10.90], [-45.29, -2.73]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'CE', nome: 'Ceará' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-41.56, -2.44], [-37.30, -2.44], [-37.30, -7.92], [-41.56, -7.92], [-41.56, -2.44]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'RN', nome: 'Rio Grande do Norte' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-38.35, -4.82], [-34.98, -4.82], [-34.98, -6.76], [-38.35, -6.76], [-38.35, -4.82]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'PB', nome: 'Paraíba' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-38.74, -6.84], [-34.73, -6.84], [-34.73, -8.83], [-38.74, -8.83], [-38.74, -6.84]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'PE', nome: 'Pernambuco' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-37.36, -7.92], [-34.79, -7.92], [-34.79, -9.28], [-37.36, -9.28], [-37.36, -7.92]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'AL', nome: 'Alagoas' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-37.81, -8.82], [-36.41, -8.82], [-36.41, -10.49], [-37.81, -10.49], [-37.81, -8.82]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'SE', nome: 'Sergipe' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-38.03, -9.53], [-36.42, -9.53], [-36.42, -10.90], [-38.03, -10.90], [-38.03, -9.53]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'BA', nome: 'Bahia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-49.72, -9.02], [-37.27, -9.02], [-37.27, -18.32], [-49.72, -18.32], [-49.72, -9.02]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'MG', nome: 'Minas Gerais' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-46.89, -14.85], [-40.25, -14.85], [-40.25, -23.32], [-46.89, -23.32], [-46.89, -14.85]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'ES', nome: 'Espírito Santo' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-41.86, -17.04], [-40.27, -17.04], [-40.27, -21.30], [-41.86, -21.30], [-41.86, -17.04]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'RJ', nome: 'Rio de Janeiro' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-44.88, -20.77], [-40.96, -20.77], [-40.96, -23.37], [-44.88, -23.37], [-44.88, -20.77]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'SP', nome: 'São Paulo' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-55.73, -19.78], [-44.16, -19.78], [-44.16, -25.31], [-55.73, -25.31], [-55.73, -19.78]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'PR', nome: 'Paraná' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-56.09, -22.50], [-48.04, -22.50], [-48.04, -27.36], [-56.09, -27.36], [-56.09, -22.50]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'SC', nome: 'Santa Catarina' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-56.50, -25.95], [-48.36, -25.95], [-48.36, -29.38], [-56.50, -29.38], [-56.50, -25.95]]]
      }
    },
    {
      type: 'Feature',
      properties: { estado: 'RS', nome: 'Rio Grande do Sul' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-56.51, -27.04], [-49.64, -27.04], [-49.64, -34.07], [-56.51, -34.07], [-56.51, -27.04]]]
      }
    }
  ]
};
