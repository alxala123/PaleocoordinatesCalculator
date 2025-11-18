const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// CORS
app.use(cors({
  origin: [
    'http://161.116.82.76:5000',
    'http://localhost:5000', 
    'http://localhost:5173',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Crear directorios si no existen
const resultsDir = path.join(__dirname, 'results');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/results', express.static(resultsDir));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: '161.116.82.76:8080'
  });
});

// === Endpoint 1: Rotar un solo punto (lat, lng) ===
app.post('/api/rotate', (req, res) => {
  console.log('Received rotate request:', req.body);
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  // Verificar si los scripts R existen
  const scriptPath = path.join(__dirname, 'rotate_temp.R');
  
  if (!fs.existsSync(scriptPath)) {
    console.log('R script not found, returning simulated data');
    // Datos simulados mientras configuras los scripts R
    const simulatedResult = {
      lat: parseFloat(lat) + (Math.random() - 0.5) * 10,
      lng: parseFloat(lng) + (Math.random() - 0.5) * 10
    };
    return res.json(simulatedResult);
  }

  const cmd = `Rscript "${scriptPath}" ${lat} ${lng}`;

  exec(cmd, { cwd: __dirname, timeout: 10000 }, (err, stdout, stderr) => {
    if (err) {
      console.error('Error ejecutando Rscript:', err);
      console.error('stderr:', stderr);
      return res.status(500).json({ error: stderr || err.message });
    }

    console.log('Rscript stdout:', stdout);

    try {
      const csvPath = path.join(__dirname, 'results', 'rotated.csv');
      
      if (!fs.existsSync(csvPath)) {
        throw new Error('Archivo CSV de resultados no encontrado');
      }

      const content = fs.readFileSync(csvPath, 'utf8');
      console.log('Contenido CSV:', content);

      const lines = content.trim().split('\n');
      if (lines.length < 2) throw new Error('CSV incompleto');

      const values = lines[1].split(',');
      const rotatedLng = parseFloat(values[1]);
      const rotatedLat = parseFloat(values[2]);

      res.json({ lat: rotatedLat, lng: rotatedLng });
    } catch (readErr) {
      console.error('Error leyendo resultado CSV:', readErr);
      res.status(500).json({ error: 'Error leyendo resultado CSV: ' + readErr.message });
    }
  });
});

// === Endpoint 2: Rotar archivo subido con modelo ===
app.post('/api/rotate-file', upload.single('file'), (req, res) => {
  console.log('Received file upload request');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const model = req.body.model || 'All';
  const inputPath = req.file.path;
  const timestamp = Date.now();
  const outputPath = path.join(__dirname, 'results', `rotated_${timestamp}.csv`);
  const periodsPath = path.join(__dirname, 'data', 'periods.csv');

  console.log('File details:', {
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    model: model
  });

  // Verificar si el script existe
  const scriptPath = path.join(__dirname, 'rotate_file.R');
  
  if (!fs.existsSync(scriptPath)) {
    fs.unlink(inputPath, () => {});
    console.log('R script not found, returning simulated CSV');
    
    // Crear un CSV
    const simulatedCSV = `lat,lng,rotated_lat,rotated_lng
40.7128,-74.0060,35.2,-80.1
51.5074,-0.1278,48.8,-2.3`;
    
    fs.writeFileSync(outputPath, simulatedCSV);
    
    return res.download(outputPath, 'rotated.csv', (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Error sending file' });
      }
      // Limpiar archivos temporales
      fs.unlink(inputPath, () => {});
      fs.unlink(outputPath, () => {});
    });
  }

  // Comando para ejecutar R con los argumentos: input, modelo, periods, output
  const cmd = `Rscript "${scriptPath}" "${inputPath}" "${model}" "${periodsPath}" "${outputPath}"`;

  exec(cmd, { cwd: __dirname }, (err, stdout, stderr) => {
    // Borrar archivo subido temporal
    fs.unlink(inputPath, () => {});

    if (err) {
      console.error('Error ejecutando rotate_file.R:', err);
      console.error('stderr:', stderr);
      return res.status(500).json({ error: stderr || err.message });
    }

    // Verificar que el archivo de salida existe
    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ error: 'Output file was not created' });
    }

    // Obtener tamaño del archivo para Content-Length
    fs.stat(outputPath, (statErr, stats) => {
      if (statErr) {
        console.error('Error obteniendo stats del archivo:', statErr);
        return res.status(500).json({ error: 'Error obteniendo archivo' });
      }

      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="rotated.csv"',
        'Content-Length': stats.size,
      });

      const readStream = fs.createReadStream(outputPath);
      readStream.pipe(res);

      readStream.on('end', () => {
        // Opcional: borrar archivo resultante para no acumular
        fs.unlink(outputPath, () => {});
      });

      readStream.on('error', (streamErr) => {
        console.error('Error leyendo archivo para enviar:', streamErr);
        res.status(500).end();
      });
    });
  });
});

// Errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Lanzar el servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log(`Server accessible at http://161.116.82.76:${PORT}`);
});