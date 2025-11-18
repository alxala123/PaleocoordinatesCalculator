import React from 'react';
import './About.css';
import {
  FaGlobe,
  FaCode,
  FaMapMarkedAlt,
  FaBalanceScale,
  FaExternalLinkAlt
} from 'react-icons/fa';

const About = () => {
  return (
    <div className="about">
      <h1>About This Project</h1>

      {/* MODELS */}
      <section className="about-section">
        <div className="about-icon"><FaGlobe /></div>
        <div>
          <h2>About the Models</h2>
          <p>
            This website uses publicly available Global Plate Models via the palaeorotate function in the palaeoverse R package to estimate past geographic coordinates.
            These models reflect different scientific interpretations of Earth's tectonic history.
          </p>
          <p>
            The method used is <strong>'point'</strong> for higher precision. Decimal values are preserved for longitude, latitude and age.
          </p>
          <ul>
            <li><strong>MERDITH2021</strong> (Merdith et al., 2021): 0–1000 Ma</li>
            <li><strong>TorsvikCocks2017</strong> (Torsvik & Cocks, 2016): 0–540 Ma</li>
            <li><strong>MATTHEWS2016_pmag_ref</strong> (Matthews et al., 2016): 0–410 Ma</li>
            <li><strong>GOLONKA</strong> (Wright et al., 2013): 0–540 Ma</li>
            <li><strong>PALEOMAP</strong> (Scotese, 2016): 0–1100 Ma</li>
          </ul>
          <p>
            Learn more at <a href="https://palaeoverse.org/" target="_blank" rel="noopener noreferrer">
              palaeoverse.org <FaExternalLinkAlt className="inline-icon" /></a>
          </p>
          <p className="ref">
            Jones, L. A. et al. (2023). Palaeoverse: A community-driven R package... <br />
            <a href="https://doi.org/10.1111/2041-210X.14099" target="_blank" rel="noopener noreferrer">DOI link</a>
          </p>
        </div>
      </section>

      {/* CODE */}
      <section className="about-section">
        <div className="about-icon"><FaCode /></div>
        <div>
          <h2>About the Code</h2>
          <p>
            Calculations are powered by the open-source language R and the palaeoverse package, specifically the palaeorotate function.
          </p>
          <p>
            The package is maintained by a community of researchers and available under its license. Explore it at:
            <a href="https://palaeoverse.org/" target="_blank" rel="noopener noreferrer">
              palaeoverse.org <FaExternalLinkAlt className="inline-icon" /></a>
          </p>
          <p className="ref">
            Jones, L. A. et al. (2023). Methods in Ecology and Evolution...<br />
            <a href="https://doi.org/10.1111/2041-210X.14099" target="_blank" rel="noopener noreferrer">DOI link</a>
          </p>
        </div>
      </section>

      {/* MAPS */}
      <section className="about-section">
        <div className="about-icon"><FaMapMarkedAlt /></div>
        <div>
          <h2>About the Paleomaps</h2>
          <p>
            Visualization uses maps by Scotese (2016):
            <br />
            <em>PALEOMAP PaleoAtlas for Gplates and the PaleoData Plotter Program</em> –
            <a href="http://www.earthbyte.org/paleomap--paleoatlas--for--gplates" target="_blank" rel="noopener noreferrer">
              earthbyte.org <FaExternalLinkAlt className="inline-icon" /></a>
          </p>
        </div>
      </section>

      {/* RIGHTS */}
      <section className="about-section">
        <div className="about-icon"><FaBalanceScale /></div>
        <div>
          <h2>Content Rights</h2>
          <p>
            The models and tools used are publicly available. Intellectual property belongs to the respective creators as per their licenses and publications.
          </p>
          <p>
            Outputs may be used for research and analysis. Citation is required. Please see our <strong>CITATION</strong> menu for details.
          </p>
          <p>
            Users should cite the original sources of any Global Plate Models used, and refer to the palaeoverse documentation.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
