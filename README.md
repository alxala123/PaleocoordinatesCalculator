# Paleocoordinates Calculator

Paleocoordinates is a web application for calculating paleogeographic positions (paleolatitude/paleolongitude) of present-day locations. Its scientific goal is to facilitate tectonic rotation of modern geographic coordinates to a specified geological period, supporting studies in paleobiogeography and paleoclimatology. The app integrates global plate tectonic models and allows users to visualize results on an interactive 3D globe, aiding exploration of ancient geographic contexts.

## Key Features

* **Rotate current coordinates:** Computes paleolatitude and paleolongitude of your current location (via browser geolocation).
* **CSV upload and batch processing:** Upload a CSV file with multiple points (latitude, longitude, and ages) and apply paleogeographic rotation using selected tectonic models.
* **Tectonic model selection:** Choose among various global models (e.g., *MERDITH2021*, *TorsvikCocks2017*, *MATTHEWS2016*, *GOLONKA*, *PALEOMAP*) during data processing.
* **Interactive 3D visualization:** Display rotated points on a paleogeographic globe (built with React-Three-Fiber and react-globe.gl). Includes orbit, zoom, and export controls.
* **Result downloads:** After rotation, download a CSV with original and rotated coordinates. Also supports exporting the 3D scene as a GLB file.

## Screenshots

*Insert illustrative screenshots of the interface here: 3D globe view, CSV upload page, rotation results, etc.*

## Installation and Deployment

**Requirements:** Node.js (v14+), npm, R (v4.x or higher) with packages `palaeoverse`, `dplyr`, `tidyr`, `readxl`, `stringr`. [Optional] Docker and Docker Compose.

### Local Installation

```bash
git clone https://github.com/your-username/paleocoordinates.git
cd paleocoordinates

# Backend (Node.js server with R scripts)
cd server
npm install
npm run dev        # runs server at http://localhost:8080

# Frontend (React/Vite app)
cd ../src
npm install
npm run dev        # runs app at http://localhost:5000 or http://localhost:5173
```

*Note:* Ensure `VITE_API_URL` in the frontend points to `http://localhost:8080`.

### Docker Deployment

Install Docker and run:

```bash
docker-compose up --build
```

This builds and launches two containers (frontend and backend) defined in `docker-compose.yml`. Access the app at `http://localhost:5000`. Backend listens on port 8080. Volumes `server/results` and `server/uploads` store results and uploaded files.

## Usage

* **Rotate current location:** On the homepage, click "Use my location" (or manually enter coordinates) and select the desired tectonic model. The app sends this to the server which uses an R script to return rotated paleocoordinates.
* **Upload and process CSV:** Navigate to the CSV upload section, provide a file with columns (`lat`, `lng`, `age_min`, `age_max`), choose one or more models, and click "Process". A rotated CSV will be returned for download.
* **3D result visualization:** Rotated results are shown on a 3D globe. Use mouse or gestures to orbit, zoom, and pan. Point labels are shown on hover. You can export the globe as a `.glb` file or capture screenshots.

## Supported Paleogeographic Models

This app supports the following rotation models:

* **MERDITH2021:** Global plate reconstruction from 1000 Ma to present (Merdith et al. 2021).
* **Torsvik-Cocks 2017:** Detailed Phanerozoic reconstructions (Torsvik & Cocks 2017).
* **MATTHEWS2016_pmag_ref:** Paleozoic to present, paleomagnetic reference frame (Matthews et al. 2016).
* **GOLONKA:** Global paleogeographic reconstructions (Wright et al. 2013).
* **PALEOMAP (Scotese):** Paleogeographic digital atlas for GPlates (Scotese 2016).
* **ALL:** Compute rotation using all models for comparison.

## Scientific Sources and Citation

Paleocoordinates is based on peer-reviewed sources and libraries. Rotation calculations use the R package *palaeoverse* (Jones et al. 2023), integrating paleomagnetic and plate reconstruction data. Tectonic models are based on:

* Merdith et al. (2021)
* Matthews et al. (2016)
* Wright et al. (2013)
* Scotese (2016)
* Torsvik & Cocks (2017)

Visualization is powered by open-source libraries like React, Three.js (@react-three/fiber), and PapaParse.

## Credits and Authors

* **Developers:** Paleocoordinates team (Biost3 team, 2025).
* **R scripts:** Built with *palaeoverse* and tidyverse ecosystem.
* **3D Visualization:** Built with React Three Fiber, react-globe.gl, Framer Motion, Tailwind CSS, and more.
* **Acknowledgments:** Inspired by GPlates and paleogeographic tools cited above.

## License

This project is open source under the **MIT License**. See `LICENSE` for details.

**Cite as:** Jones et al. (2023), Merdith et al. (2021), Matthews et al. (2016), Wright et al. (2013), Scotese (2016), Torsvik & Cocks (2017).
