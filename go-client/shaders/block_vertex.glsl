#version 130

uniform mat4 matrix;
uniform float timer;

in vec4 position;
in vec2 uv;

out vec2 frag_uv;

mat4 rotationMatrix(vec3 axis, float angle) {
    vec3 a = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat4(
        oc * a.x * a.x + c,
        oc * a.x * a.y - a.z * s,
        oc * a.z * a.x + a.y * s,
        0.0,

        oc * a.x * a.y + a.z * s,
        oc * a.y * a.y + c,
        oc * a.y * a.z - a.x * s,
        0.0,

        oc * a.z * a.x - a.y * s,
        oc * a.y * a.z + a.x * s,
        oc * a.z * a.z + c,
        0.0,

        0.0,
        0.0,
        0.0,
        1.0
    );
}

void main() {
    gl_Position = matrix * rotationMatrix(vec3(0, 1, 0), sin(timer * 2) / 2) * position;
    frag_uv = uv;
}


// #version 120

// uniform mat4 matrix;
// uniform vec3 camera;
// uniform float fog_distance;

// attribute vec4 position;
// attribute vec3 normal;
// attribute vec2 uv;

// varying vec2 fragment_uv;
// varying float fragment_ao;
// varying float fragment_light;
// varying float fog_factor;
// varying float fog_height;
// varying float diffuse;

// const float pi = 3.14159265;
// const vec3 light_direction = normalize(vec3(-1.0, 1.0, -1.0));

// void main() {
// 	gl_Position = position;
//     gl_Position = gl_ModelViewProjectionMatrix * position;//matrix * position;
//     fragment_uv = uv.xy;
//     fragment_ao = 0.5;//0.3 + (1.0 - uv.z) * 0.7;
//     fragment_light = 0.5;//uv.w;
//     diffuse = max(0.0, dot(normal, light_direction));

//     float camera_distance = distance(camera, vec3(position));
// 	fog_factor = pow(clamp(camera_distance / fog_distance, 0.0, 1.0), 4.0);
// 	float dy = position.y - camera.y;
// 	float dx = distance(position.xz, camera.xz);
// 	fog_height = (atan(dy, dx) + pi / 2) / pi;
// }
