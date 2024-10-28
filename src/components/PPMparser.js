import React, { useRef, useState } from "react";

const PpmParser = () => {
  const canvasRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const loadPpmFile = (file) => {
    const reader = new FileReader();
  
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      
      const headerString = new TextDecoder().decode(arrayBuffer.slice(0, 2));
      const format = headerString === "P3" ? "P3" : headerString === "P6" ? "P6" : null;
  
      if (!format) {
        alert("Not a valid PPM file (P3 or P6 expected)");
        return;
      }
  
      if (format === "P3") {
        const content = new TextDecoder().decode(arrayBuffer);
        parsePpmP3(content);
      } else {
        parsePpmP6(arrayBuffer);
      }
    };
  
    reader.readAsArrayBuffer(file);
  };
  

  const parsePpmP3 = (content) => {
    const lines = content.split('\n');
    let index = 1;
  
    // Skip comments
    while (lines[index].startsWith("#")) index++;
    const [width, height] = lines[index++].trim().split(/\s+/).map(Number);
    const maxColorValue = parseInt(lines[index++].trim(), 10);
  
    // Parse pixel data
    const pixelData = lines.slice(index).join(' ').trim().split(/\s+/);
    const pixels = [];
    for (let i = 0; i < pixelData.length; i += 3) {
      const r = (parseInt(pixelData[i], 10) * 255) / maxColorValue;
      const g = (parseInt(pixelData[i + 1], 10) * 255) / maxColorValue;
      const b = (parseInt(pixelData[i + 2], 10) * 255) / maxColorValue;
      pixels.push([r, g, b]);
    }
  
    renderToCanvas(pixels, width, height);
  };
  
  const parsePpmP6 = (arrayBuffer) => {
    const dataView = new DataView(arrayBuffer);
    let offset = 2;
  
    while (dataView.getUint8(offset) === 35) { // ASCII '#'
      while (dataView.getUint8(offset++) !== 10);
    }
  
    const width = parseInt(getNextToken(dataView, offset), 10);
    offset += width.toString().length + 1;
    const height = parseInt(getNextToken(dataView, offset), 10);
    offset += height.toString().length + 1;
    const maxColorValue = parseInt(getNextToken(dataView, offset), 10);
    offset += maxColorValue.toString().length + 1;
  
    // Parse pixel data
    const pixels = [];
    for (let i = offset; i < dataView.byteLength; i += 3) {
      const r = (dataView.getUint8(i) * 255) / maxColorValue;
      const g = (dataView.getUint8(i + 1) * 255) / maxColorValue;
      const b = (dataView.getUint8(i + 2) * 255) / maxColorValue;
      pixels.push([r, g, b]);
    }
  
    renderToCanvas(pixels, width, height);
  };
  
  const getNextToken = (dataView, offset) => {
    let result = '';
    let char;
    while ((char = String.fromCharCode(dataView.getUint8(offset++))) !== ' ' && char !== '\n') {
      result += char;
    }
    return result;
  };
  
  const renderToCanvas = (pixels, width, height) => {

    setImageDimensions({ width, height });
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(width, height);
  
    let pixelIndex = 0;
    for (let i = 0; i < pixels.length; i++) {
      const [r, g, b] = pixels[i];
      imageData.data[pixelIndex] = r;
      imageData.data[pixelIndex + 1] = g;
      imageData.data[pixelIndex + 2] = b;
      imageData.data[pixelIndex + 3] = 255; // Alpha
      pixelIndex += 4;
    }
  
    requestAnimationFrame(() => {
      ctx.putImageData(imageData, 0, 0);
      console.log("Image drawn to canvas");
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      loadPpmFile(file);
    }
  };

  return (
    <div>
      <input type="file" accept=".ppm" onChange={handleFileUpload} />
      <canvas
        ref={canvasRef}
        width={imageDimensions.width}
        height={imageDimensions.height}
        style={{
          border: "1px solid black",
          width: `${imageDimensions.width}px`,
          height: `${imageDimensions.height}px`,
          imageRendering: "pixelated"
        }}
      ></canvas>
    </div>
  );
};


export default PpmParser;
