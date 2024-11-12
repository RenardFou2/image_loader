import React, { useRef, useState } from "react";

const PpmParser = () => {
  const canvasRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [quality, setQuality] = useState(0.9);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [rgbValue, setRgbValue] = useState({ r: 0, g: 0, b: 0 });

  const loadPpmFile = (file) => {
    const reader = new FileReader();
  
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      
      const headerString = new TextDecoder().decode(arrayBuffer.slice(0, 2));
      const format = headerString === "P3" ? "P3" : headerString === "P6" ? "P6" : null;
  
      if (!format) {
        alert("Not a valid file, JPG or PPM (P3/P6) expected");
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
    const lines = content.split("\n").map(line => line.trim()).filter(line => line && !line.startsWith("#"));
  
    let width, height, maxColorValue;
    let pixelDataStartIndex = 0;
  
    for (let i = 0; i < lines.length; i++) {
      const lineValues = lines[i].split(/\s+/).map(Number).filter(val => !isNaN(val));
      if (!width && lineValues.length) width = lineValues.shift();
      if (!height && lineValues.length) height = lineValues.shift();
      if (!maxColorValue && lineValues.length) maxColorValue = lineValues.shift();
      
      if (width && height && maxColorValue) {
        pixelDataStartIndex = i + 1;
        break;
      }
    }
  
    if (!width || !height || !maxColorValue) {
      console.error("Invalid PPM P3 header.");
      return;
    }

    const pixelData = lines.slice(pixelDataStartIndex).join(" ").split(/\s+/).map(Number).filter(val => !isNaN(val));
    const pixels = [];
  
    for (let i = 0; i < pixelData.length; i += 3) {
      const r = (pixelData[i] * 255) / maxColorValue;
      const g = (pixelData[i + 1] * 255) / maxColorValue;
      const b = (pixelData[i + 2] * 255) / maxColorValue;
      pixels.push([r, g, b]);
    }

    renderToCanvas(pixels, width, height);
  };
  
  
  const parsePpmP6 = (arrayBuffer) => {
    const dataView = new DataView(arrayBuffer);
    let offset = 2; // Start po "P6"
  
    let header = '';
    while (true) {
      const char = String.fromCharCode(dataView.getUint8(offset++));
      header += char;
      if (char === "\n" && header.includes("255")) break;
    }
  
    const headerLines = header.split("\n").filter(line => !line.startsWith("#") && line.trim());
    const [width, height] = headerLines[0].split(" ").map(Number);
    const maxColorValue = parseInt(headerLines[1], 10);
  
    if (isNaN(width) || isNaN(height) || isNaN(maxColorValue)) {
      console.error("Invalid PPM P6 header.");
      return;
    }
  
    const pixels = [];
    for (let i = offset; i < dataView.byteLength; i += 3) {
      const r = (dataView.getUint8(i) * 255) / maxColorValue;
      const g = (dataView.getUint8(i + 1) * 255) / maxColorValue;
      const b = (dataView.getUint8(i + 2) * 255) / maxColorValue;
      pixels.push([r, g, b]);
    }

    renderToCanvas(pixels, width, height);
  };
  
  const renderToCanvas = (pixels, width, height) => {

    setImageDimensions({ width, height });
    const canvas = canvasRef.current;
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
      setImageLoaded(true);
      console.log("Image drawn to canvas");
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "image/jpeg") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          const width = img.width;
          const height = img.height;
          setImageDimensions({ width, height });
          
          requestAnimationFrame(() => {
            ctx.drawImage(img, 0, 0);
            setImageLoaded(true);
            console.log("Image drawn to canvas");
          });

        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      loadPpmFile(file);
    }
  };

  const saveAsJpeg = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/jpeg", quality);
    link.download = "output.jpg";
    link.click();
  };

  const handleMouseMove = (event) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePosition({ x: Math.floor(x), y: Math.floor(y) });

    if (ctx && imageLoaded) {
      const pixelData = ctx.getImageData(x, y, 1, 1).data;
      setRgbValue({
        r: pixelData[0],
        g: pixelData[1],
        b: pixelData[2],
      });
    }
  };

  return (
    <div>
      <input type="file" accept=".ppm, .jpg, jpeg" onChange={handleFileUpload} />
      <canvas
        ref={canvasRef}
        width={imageDimensions.width}
        height={imageDimensions.height}
        onMouseMove={handleMouseMove}
        style={{
          border: "1px solid black",
          width: `${imageDimensions.width}px`,
          height: `${imageDimensions.height}px`,
          imageRendering: "pixelated"
        }}
      ></canvas>
      {imageLoaded && (
        <div>
          <label>
            JPEG Quality: {Math.round(quality * 100)}%
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
            />
          </label>
          <button onClick={saveAsJpeg}>Save as JPEG</button>
        </div>
      )}
      <div>
        <p>Mouse Position: X: {mousePosition.x}, Y: {mousePosition.y}</p>
        <p>RGB Value: R: {rgbValue.r}, G: {rgbValue.g}, B: {rgbValue.b}</p>
      </div>
    </div>
  );
};


export default PpmParser;
