import {THREE} from "@croquet/worldcore";

//------------------------------------------------------------------------------------------
//-- Three ---------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------

export class TriBuilder {
    constructor() {
        this.clear();
    }

    clear() {
        this.vertices = [];
    }

    build() {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( this.vertices, 3 ) );
        geometry.computeVertexNormals();
        this.clear();
        return geometry;
    }

    addFace(vertices) {
        const triCount = vertices.length - 2

        for (let i = 0; i < triCount; i++) {

            //-- Vertex A--

            this.vertices.push(...vertices[0]);

            //-- Vertex B --

            this.vertices.push(...vertices[i+1]);

            //-- Vertex C --

            this.vertices.push(...vertices[i+2]);
        }
    }
}

export class TriangleBuilder {
    constructor() {
        this.clear();
    }

    clear() {
        this.vertices = [];
        this.colors = [];
        this.uvs = [];
    }

    build() {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( this.vertices, 3 ) );
        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( this.colors, 3) );
        geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( this.uvs, 2) );
        geometry.computeVertexNormals();
        this.clear();
        return geometry;
    }

    addFace(vertices, uvs, color) {
        const triCount = vertices.length - 2


        for (let i = 0; i < triCount; i++) {

            //-- Vertex A--

            this.vertices.push(...vertices[0]);
            this.colors.push(...color);
            this.uvs.push(...uvs[0]);

            // //-- Vertex B --

            this.vertices.push(...vertices[i+1]);
            this.colors.push(...color);
            this.uvs.push(...uvs[i+1]);

            // //-- Vertex C --

            this.vertices.push(...vertices[i+2]);
            this.colors.push(...color);
            this.uvs.push(...uvs[i+2]);
        }
    }
}

export class LineBuilder {
    constructor() {
        this.clear();
    }

    clear() {
        this.vertices = [];
    }

    build() {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( this.vertices, 3 ) );
        geometry.computeVertexNormals();
        this.clear();
        return geometry;
    }

    addLoop(vertices) {
        const segmentCount = vertices.length;

        for (let i = 0; i < segmentCount; i++) {
            this.vertices.push(...vertices[i]);
            const b = (i+1) % segmentCount
            this.vertices.push(...vertices[b]);
        }
    }
}

export function setGeometryColor(geometry, color) {

    const count = geometry.getAttribute("position").count;
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(...color);
    }
    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3) );

}
