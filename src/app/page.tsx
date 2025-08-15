'use client';

import { useState, useEffect } from 'react';

// This makes the createCalculatorModule function available on the window object
declare global {
  interface Window {
    createCalculatorModule: () => Promise<any>;
  }
}

type WasmAddFunction = (a: number, b: number) => number;

export default function HomePage() {
  const [add, setAdd] = useState<WasmAddFunction | null>(null);
  const [num1, setNum1] = useState<number | ''>('');
  const [num2, setNum2] = useState<number | ''>('');
  const [result, setResult] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWasmModule = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if the script is already loaded
        // if (window.createCalculatorModule) {
        //   return resolve();
        // }

        const script = document.createElement('script');
        script.src = '/wasm/calculator.js'; // The public path to your glue code
        script.async = true;

        script.onload = () => {
          console.log("WASM glue script loaded.");
          resolve();
        };

        script.onerror = (err) => {
          console.error("Failed to load WASM glue script.", err);
          reject(new Error("Failed to load the WASM glue script."));
        };

        document.body.appendChild(script);
      });
    };

    const initializeWasm = async () => {
      try {
        await loadWasmModule();
        
        if (!window.createCalculatorModule) {
            throw new Error("WASM module factory not found on window object.");
        }
        
        // The factory is now available globally
        const instance = await window.createCalculatorModule();
        
        const addFunction = instance.cwrap('add', 'number', ['number', 'number']) as WasmAddFunction;
        
        setAdd(() => addFunction);
        console.log("WASM Module Initialized and Function Wrapped!");

      } catch (err: any) {
        console.error(err);
        setError(err.message || "An unknown error occurred while loading WASM.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeWasm();

  }, []); // Empty dependency array ensures this runs only once on mount

  // ... (rest of your component code remains the same)
  const handleCalculate = () => {

    if(num1 === '' || num2 === ''){
      alert("Please Enter both Numbers")
      return
    }
    if (add) {
      const sum = add(num1, num2);
      setResult(sum);
      setNum1('')
      setNum2('')
    } else {
      console.error("WASM 'add' function not loaded yet.");
    }
  };

  return (
    <div className='flex items-center justify-center h-screen'>
<main className="p-8">
  <h1 className="text-3xl font-bold mb-6">C++ WASM Calculator in Next.js</h1>

  {isLoading && <p className="text-gray-500">Loading WebAssembly Module...</p>}
  {error && <p className="text-red-500">{error}</p>}

  {!isLoading && !error && (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <input
        type="text"
        value={num1}
        onChange={(e) => {
          const val = e.target.value;
          if(/^\d*$/.test(val)) {  
      setNum1(parseInt(val, 10))
        }}
      }
        className="border border-gray-300 rounded px-3 py-2 w-24 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <span className="text-xl font-semibold">+</span>

      <input
        type="text"
        value={num2}
        onChange={(e) => {
          const val = e.target.value;
          if(/^\d*$/.test(val)){
            setNum2(parseInt(val, 10))
          }
        }}
        className="w-24 border border-gray-300 rounded px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={handleCalculate}
        disabled={!add}
        className={`px-4 py-2 rounded text-white font-semibold transition ${
          add
            ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Calculate
      </button>
    </div>
  )}

  {result !== null && (
    <h2 className="mt-6 text-2xl font-medium text-center">C++ Result: {result}</h2>
  )}
</main>
</div>
  );
}