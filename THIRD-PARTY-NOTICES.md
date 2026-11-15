# Third-party material

The [MIT license](LICENSE) covers original BY STAR code and documentation. It does not relicense upstream software, NASA material, institutional names or logos.

## Software distributed in the browser bundle

Full upstream notices are reproduced in the deployed [THIRD-PARTY-NOTICES.txt](https://by-star-team-challenge.pages.dev/THIRD-PARTY-NOTICES.txt). The build creates this file in `dist/` with `scripts/build-static-site.mjs`:

- Inter Variable font: SIL Open Font License 1.1.
- lit-html: BSD 3-Clause License.
- Ajv runtime: MIT License.
- fast-deep-equal validator helper: MIT License.

Development dependencies retain their respective licenses. They include TypeScript and Playwright (Apache 2.0), Vite (MIT), and axe-core accessibility test tooling (MPL 2.0). The dependency lockfile records the installed versions. `node_modules` is not committed or served as part of the demo.

## NASA material and references

- Lunar image: NASA's Scientific Visualization Studio, [The Moon's Far Side, visualization 11747](https://svs.gsfc.nasa.gov/11747/). The asset remains in `public/media/lunar-far-side.jpg` and its built copy, with its credit retained in the distribution notice.
- Historical radiation sample: [NASA OSDR RadLab API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/). `public/data/radlab-iss-sample.json` preserves its query, measurement dates, instrument identity, units and original measurements. It contains 16 historical ISS dose-rate observations; they are not current lunar or astronaut readings.
- Scientific references: sources linked in `public/data/mission.json`, [PRODUCT-BRIEF.md](docs/PRODUCT-BRIEF.md), [CLINICAL-DATA.md](docs/CLINICAL-DATA.md), and [EXERCISE-DATA.md](docs/EXERCISE-DATA.md). These sources inform the prototype; the fictional instructions are not NASA-approved medical procedures.

Preserve original credits and applicable source terms when redistributing NASA material. See [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). BY STAR does not claim NASA endorsement or certification.
