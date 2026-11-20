import { writeFileSync } from "node:fs";

const points = [];
const groundHeight = (x, y) => {
  const distance = Math.abs(x - Math.round(8 * Math.sin(y / 45)));
  if (distance <= 15) return 0;
  const levee = Math.max(0, 1 - Math.abs(distance - 42) / 7);
  return Math.min(2, (distance - 15) / 3) + 4 * levee;
};

for (let y = -90; y <= 90; y++) {
  for (let x = -60; x <= 60; x++) {
    if (x >= 42 && x < 54 && y >= 30 && y < 42) continue;
    const height = groundHeight(x, y);
    points.push([x, y, height, height === 0 ? 9 : 2]);
  }
}
for (let y = -4; y <= 4; y++) {
  for (let x = -30; x <= 30; x++) points.push([x, y, 9, 17]);
}
for (const x of [-34, 30]) {
  for (const y of [-76, -53, -28, 24, 56, 78]) {
    for (let ring = 0; ring < 10; ring++) {
      const radius = 2.7 * Math.sin(Math.PI * (ring + 1) / 11);
      for (let spoke = 0; spoke < 12; spoke++) {
        const angle = 2 * Math.PI * (spoke + ring / 3) / 12;
        points.push([
          x + radius * Math.cos(angle),
          y + radius * Math.sin(angle),
          groundHeight(x, y) + 1.5 + ring * 0.6,
          5,
        ]);
      }
    }
  }
}

const wkt = Buffer.from('LOCAL_CS["Synthetic river and bridge",LOCAL_DATUM["Synthetic site origin",0],UNIT["metre",1],AXIS["X",EAST],AXIS["Y",NORTH],AXIS["Z",UP]]\0');
const headerSize = 375;
const recordSize = 30;
const pointOffset = headerSize + 54 + wkt.length;
const las = Buffer.alloc(pointOffset + points.length * recordSize);
las.write("LASF", 0);
las.writeUInt16LE(16, 6); // WKT
las[24] = 1;
las[25] = 4;
las.write("Synthetic river and bridge", 26);
las.write("PointCloudWorkbench", 58);
las.writeUInt16LE(headerSize, 94);
las.writeUInt32LE(pointOffset, 96);
las.writeUInt32LE(1, 100);
las[104] = 6;
las.writeUInt16LE(recordSize, 105);
las.writeBigUInt64LE(BigInt(points.length), 247);
las.writeBigUInt64LE(BigInt(points.length), 255);
las.write("LASF_Projection", headerSize + 2);
las.writeUInt16LE(2112, headerSize + 18);
las.writeUInt16LE(wkt.length, headerSize + 20);
las.write("Local synthetic coordinates", headerSize + 22);
wkt.copy(las, headerSize + 54);

const scale = 0.01;
for (let axis = 0; axis < 3; axis++) {
  las.writeDoubleLE(scale, 131 + axis * 8);
  const coordinates = points.map(point => Math.round(point[axis] / scale) * scale);
  las.writeDoubleLE(Math.max(...coordinates), 179 + axis * 16);
  las.writeDoubleLE(Math.min(...coordinates), 187 + axis * 16);
}
points.forEach((point, index) => {
  const offset = pointOffset + index * recordSize;
  for (let axis = 0; axis < 3; axis++) {
    las.writeInt32LE(Math.round(point[axis] / scale), offset + axis * 4);
  }
  las[offset + 14] = 0x11; // First and only return
  las[offset + 15] = 1; // Synthetic
  las[offset + 16] = point[3];
  las.writeUInt16LE(1, offset + 20);
});

writeFileSync(process.argv[2] || new URL("../demo/river-bridge-demo.las", import.meta.url), las);
