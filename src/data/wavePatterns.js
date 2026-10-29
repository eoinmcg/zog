import { vec3 } from "littlejsengine";
import config from "./config";

const X = config.maxX;
const Y = config.maxY;
const Z = 35;

export const wavePatterns = {
  left: [
    { pos: vec3(-X, 8, 0) },                // spawn
    { pos: vec3(-4, 10, -Z), duration: 1.5 }, // outbound
    { pos: vec3(0, -2, 10), duration: 2 },     // inbound
  ],

  right: [
    { pos: vec3(X, 8, 0) },
    { pos: vec3(4, 10, -Z), duration: 1.5 },
    { pos: vec3(0, -2, 10), duration: 2 },
  ],

  center: [
    { pos: vec3(0, 12, 0) },
    { pos: vec3(0, 8, -Z), duration: 1.5 },
    { pos: vec3(0, -2, 10), duration: 2 },
  ],
};
