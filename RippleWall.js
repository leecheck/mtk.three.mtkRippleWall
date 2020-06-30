import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { BaseObject } from 'maptalks.three';

let OPTIONS = {
    elevation: 0,
    color: '#0099FF',
    opacity: 0.5,
    wallHeight: 10
};

let vertexs = {
    normal_vertex: "\n  precision lowp float;\n  precision lowp int;\n  ".concat(THREE.ShaderChunk.fog_pars_vertex, "\n  varying vec2 vUv;\n  void main() {\n    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n    vUv = uv;\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n    ").concat(THREE.ShaderChunk.fog_vertex, "\n  }\n"),
}

let fragments = {
    rippleWall_fragment: "\n  precision lowp float;\n  precision lowp int;\n  uniform float time;\n  uniform float opacity;\n  uniform vec3 color;\n  uniform float num;\n  uniform float hiz;\n\n  varying vec2 vUv;\n\n  void main() {\n    vec4 fragColor = vec4(0.);\n    float sin = sin((vUv.y - time * hiz) * 10. * num);\n    float high = 0.92;\n    float medium = 0.4;\n    if (sin > high) {\n      fragColor = vec4(mix(vec3(.8, 1., 1.), color, (1. - sin) / (1. - high)), 1.);\n    } else if(sin > medium) {\n      fragColor = vec4(color, mix(1., 0., 1.-(sin - medium) / (high - medium)));\n    } else {\n      fragColor = vec4(color, 0.);\n    }\n\n    vec3 fade = mix(color, vec3(0., 0., 0.), vUv.y);\n    fragColor = mix(fragColor, vec4(fade, 1.), 0.85);\n    gl_FragColor = vec4(fragColor.rgb, fragColor.a * opacity * (1. - vUv.y));\n  }\n",
}

export default class RippleWall extends BaseObject {

    /**
     * 构造方法
     * @param {*} poly [[lon,lat],[lon,lat]] 连续的线需要用来构造polygon 简单图形未做复杂扣除等处理
     * @param {*} options 
     * @param {*} layer 
     */
    constructor(poly, options, layer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, poly });
        if (!(poly && Array.isArray(poly))) {
            throw new Error('poly is invalid');
        }
        super();
        this._initOptions(options);
        let material = new THREE.ShaderMaterial({
            uniforms: {
                time: {
                    type: "pv2",
                    value: 0
                },
                color: {
                    type: "uvs",
                    value: new THREE.Color(options.color || '#0099FF')
                },
                opacity: {
                    type: "pv2",
                    value: options.opacity || 0.5
                },
                num: {
                    type: "pv2",
                    value: 5
                },
                hiz: {
                    type: "pv2",
                    value: 0.15
                }
            },
            vertexShader: vertexs.normal_vertex,
            fragmentShader: fragments.rippleWall_fragment,
            blending: THREE.AdditiveBlending,
            transparent: !0,
            depthWrite: !1,
            depthTest: !0,
            side: THREE.DoubleSide
        })
        const z = options.elevation || 0;
        let polygon = new maptalks.Polygon([poly])
        this._createMesh(this.createGeometry(polygon, layer, options.wallHeight || 10), material);
        const center = polygon.getCenter();
        const polyPice = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(polyPice);
    }

    createGeometry(polygon, layer, height) {
        const centerPt = layer.coordinateToVector3(polygon.getCenter());
        const wall = polygon.getShell();
        const positionsV = [];
        let joinLonLat = [];
        wall.forEach(lnglat => {
            const polyPice = layer.coordinateToVector3(lnglat).sub(centerPt);
            positionsV.push(polyPice);
            joinLonLat.push(polyPice.x);
            joinLonLat.push(polyPice.y);
        });
        for (var a = joinLonLat, polySub = [], o = 0, s = 0; o < a.length - 2; o += 2, s++)
            0 === o ?
            polySub[0] = Math.sqrt((a[2] - a[0]) * (a[2] - a[0]) + (a[3] - a[1]) * (a[3] - a[1])) :
            polySub[s] = polySub[s - 1] + Math.sqrt((a[o + 2] - a[o]) * (a[o + 2] - a[o]) + (a[o + 3] - a[o + 1]) * (a[o + 3] - a[o + 1]));
        let pos = [],
            uvs = [];
        let polylenth = polySub[polySub.length - 1];
        for (let d = 0, u = pos.length, p = uvs.length; d < positionsV.length - 1; d++) {
            let pv1 = positionsV[d],
                pv2 = positionsV[d + 1],
                polyPice = polySub[d];
            pos[u++] = pv1.x,
                pos[u++] = pv1.y,
                pos[u++] = 0,
                uvs[p++] = 0 === d ? 0 : polySub[d - 1] / polylenth,
                uvs[p++] = 0,
                pos[u++] = pv2.x,
                pos[u++] = pv2.y,
                pos[u++] = 0,
                uvs[p++] = polyPice / polylenth,
                uvs[p++] = 0,
                pos[u++] = pv1.x,
                pos[u++] = pv1.y,
                pos[u++] = height,
                uvs[p++] = 0 === d ? 0 : polySub[d - 1] / polylenth,
                uvs[p++] = 1,
                pos[u++] = pv1.x,
                pos[u++] = pv1.y,
                pos[u++] = height, 
                uvs[p++] = 0 === d ? 0 : polySub[d - 1] / polylenth,
                uvs[p++] = 1,
                pos[u++] = pv2.x,
                pos[u++] = pv2.y,
                pos[u++] = 0,
                uvs[p++] = polyPice / polylenth,
                uvs[p++] = 0,
                pos[u++] = pv2.x,
                pos[u++] = pv2.y,
                pos[u++] = height,
                uvs[p++] = polyPice / polylenth,
                uvs[p++] = 1
        }
        var geometry = new THREE.BufferGeometry;
        return geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3)),
            geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2)), geometry
    }


    _animation() {
        const wall = this.getObject3d();
        wall.material.uniforms.time.value += .015;
    }
}
