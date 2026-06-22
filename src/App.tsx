/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Home } from "@/pages/Home";
import { MediaConverter } from "@/pages/MediaConverter";

// Placeholders for other routes mentioned in scope
function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-3xl font-bold text-slate-800">{title} Converter</h2>
      <p className="mt-4 text-slate-500">Coming soon in the next open-source release.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="image" element={<Placeholder title="Image" />} />
          <Route path="document" element={<Placeholder title="Document" />} />
          <Route path="media" element={<MediaConverter />} />
          <Route path="audio" element={<MediaConverter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

