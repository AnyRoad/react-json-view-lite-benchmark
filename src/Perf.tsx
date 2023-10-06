import * as React from 'react';
import {
  Benchmark,
  BenchmarkType,
  BenchResultsType,
  BenchmarkRef
} from 'react-component-benchmark';

import hugeObject from './hugeJson.json';
import hugeArray from './hugeArray.json';

import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';
import Inspector from 'react-json-inspector';
import 'react-json-inspector/json-inspector.css';
import { JSONTree } from 'react-json-tree';
import ReactJson from 'react-json-view';
import Rjv from 'react-json-tree-viewer';

const propertiesByComponent = new Map<
  string,
  { component: any; propsBuilder: (array: boolean) => Record<string, unknown> }
>();
propertiesByComponent.set('JsonView', {
  component: JsonView,
  propsBuilder: (array: boolean) => ({ data: array ? hugeArray : hugeObject })
});
propertiesByComponent.set('JSONPretty', {
  component: JSONPretty,
  propsBuilder: (array: boolean) => ({ data: array ? hugeArray : hugeObject })
});
propertiesByComponent.set('Inspector', {
  component: Inspector,
  propsBuilder: (array: boolean) => ({
    data: array ? hugeArray : hugeObject,
    isExpanded: () => true
  })
});
propertiesByComponent.set('JSONTree', {
  component: JSONTree,
  propsBuilder: (array: boolean) => ({
    data: array ? hugeArray : hugeObject,
    shouldExpandNode: () => true,
    collectionLimit: 20_000
  })
});
propertiesByComponent.set('ReactJsonView', {
  component: ReactJson,
  propsBuilder: (array: boolean) => ({
    src: array ? hugeArray : hugeObject,
    enableClipboard: false,
    displayObjectSize: false,
    displayDataTypes: false,
    groupArraysAfterLength: 20_000
  })
});
propertiesByComponent.set('ReactJsonTreeViewer', {
  component: Rjv,
  propsBuilder: (array: boolean) => ({ data: array ? hugeArray : hugeObject })
});

const componentNames = Array.from(propertiesByComponent.keys());

export default function Perf() {
  const [benchmarkType, setBenchmarkType] = React.useState('mount' as BenchmarkType);
  const [results, setResults] = React.useState('');
  const [component, setComponent] = React.useState('JsonView');
  const [dataType, setDataType] = React.useState('array');
  const [sampleCount, setSampleCount] = React.useState(50);

  const benchmarkRef = React.useRef<BenchmarkRef>(null);

  const handleStart = () => {
    benchmarkRef.current?.start();
  };

  const handleChangeType = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setBenchmarkType(event.target.value as BenchmarkType);
  };

  const handleChangeComponent = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setComponent(event.target.value);
  };

  const handleChangeDataType = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDataType(event.target.value);
  };

  const handleChangeSampleCount = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSampleCount(parseInt(event.target.value));
  };

  const handleComplete = (benchmarkResults: BenchResultsType) => {
    const values = benchmarkResults.samples.map((s) => s.elapsed).sort((a, b) => a - b);
    benchmarkResults.samples = [];
    const p70 = values[Math.floor(values.length * 0.7)];
    const p95 = values[Math.floor(values.length * 0.95)];
    const p99 = values[Math.floor(values.length * 0.99)];
    const p50 = values[Math.floor(values.length * 0.5)];
    const p90 = values[Math.floor(values.length * 0.9)];
    const extras = JSON.stringify(
      {
        p50,
        p70,
        p90,
        p95,
        p99
      },
      null,
      2
    );
    setResults(results + '\n\n' + component + '\n' + JSON.stringify(benchmarkResults, null, 2) + '\n' + extras);
  };

  const properties = propertiesByComponent.get(component) || {
    component: JsonView,
    propsBuilder: (array: boolean) => ({ data: array ? hugeArray : hugeObject })
  };

  return (
    <div>
      <span className='margin-right label'>Test Type</span>
      <select className='margin-right' onChange={handleChangeType}>
        {['mount', 'upated', 'unmount'].map((benchType) => (
          <option key={benchType} value={benchType} selected={benchType === benchmarkType}>
            {benchType}
          </option>
        ))}
      </select>

      <span className='margin-right label'>Sampels Count</span>
      <select className='margin-right' onChange={handleChangeSampleCount}>
        {['10', '20', '50', '100', '200'].map((count) => (
          <option key={count} value={count} selected={sampleCount.toString() === count}>
            {count}
          </option>
        ))}
      </select>

      <span className='margin-right label'>Test Data</span>
      <select className='margin-right' onChange={handleChangeDataType}>
        {['object', 'array'].map((type) => (
          <option key={type} value={type} selected={dataType === type}>
            {type}
          </option>
        ))}
      </select>

      <span className='margin-right label'>Test Target Library</span>
      <select className='margin-right' onChange={handleChangeComponent} value={component}>
        {componentNames.map((c) => (
          <option key={c} value={c} selected={component === c}>
            {c}
          </option>
        ))}
      </select>

      <button className='margin-right' onClick={handleStart}>
        Run
      </button>
      <button onClick={() => setResults('')}>Reset</button>

      <Benchmark
        component={properties.component}
        componentProps={properties.propsBuilder(dataType === 'array')}
        onComplete={handleComplete}
        ref={benchmarkRef}
        samples={sampleCount}
        timeout={200000}
        type={benchmarkType}
      />
      <pre>{results}</pre>
    </div>
  );
}
