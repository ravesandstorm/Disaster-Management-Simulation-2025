# Code-Phoenix-25
This repository contains the main simulation's frontend code for the hackathon conducted by E-Cell at IIIT Raipur, named "Code of the Phoenix" for 2025. This involves a project made possible using node package manager and external libraries, with a dynamic visualization of live disaster cases and resolution of disaster relief support from a central warehouse.

## Jump to:
[Working](#how-it-works)
[Dependencies](#dependencies-to-run)
[Instructions](#run-the-project)
[Tech Stack](#tech-stack)

### How it works
Two major open source libraries are used, separately in two javascript files, both of which run as dynamic servers. The _server.js_ file is responsible to generate live disaster cases using the _faker.js_ library, and the _map.js_ handles the requests, including showing them on the map with the _leaflet_ library and path generation using API calls to OpenStreetMaps. 

Every few seconds, based on a variable, a "truck" is sent, which resolves a set number of cases, i.e. provides necessary relief to these cases. The average severity of these cases can then be graphed, which provides insights into if the current amount of supplies is able to reduce overall severity of the disaster. Based on the insights, the supplies can then be regulated for each area, making this useful as a simulation tool for emergency situations.

This implementation is only the main simulation, which I worked on. The entire project with frontend and analytics is hosted at: [Sriyam's Repository](https://github.com/sriyummy/Disaster-Manager)

### Dependencies to run
  - install node and npm packages in main folder
  - `npm install express mongoose socket.io cors @faker.js/faker leaflet.animatedmarker`
  - ` npm install -y `
  - add ` "type": "module" ` in _package.json_ file (you should have this after installing npm in the folder correctly)
  - ` npm install nodemon -D ` 

### Run the project
  - use `cd <folder name>` till you reach the project folder
  - run servers for 'http' website and 'faker' requests in different terminals
  - ` node server.js `
  - ` python -m http.server 8000 `

### Tech Stack
  - Frontend (_server.js_): HTML, CSS, JavaScript, Leaflet.js
  - Backend (_map.js_): Node.js, Express.js, Faker.js
  - Miscellaneous: OpenStreetMaps (_API_), socket.io (_file communication_), npm (_library manager_)
