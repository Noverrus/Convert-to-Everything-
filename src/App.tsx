/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Home } from "@/pages/Home";
import { VideoConverter } from "@/pages/VideoConverter";
import { ImageConverter } from "@/pages/ImageConverter";
import { DocumentConverter } from "@/pages/DocumentConverter";
import { ArchiveConverter } from "@/pages/ArchiveConverter";
import { CadConverter } from "@/pages/CadConverter";
import { EbookConverter } from "@/pages/EbookConverter";
import { FontConverter } from "@/pages/FontConverter";
import { PresentationConverter } from "@/pages/PresentationConverter";
import { SpreadsheetConverter } from "@/pages/SpreadsheetConverter";
import { VectorConverter } from "@/pages/VectorConverter";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="image" element={<ImageConverter />} />
          <Route path="document" element={<DocumentConverter />} />
          <Route path="video" element={<VideoConverter />} />
          <Route path="archive" element={<ArchiveConverter />} />
          <Route path="cad" element={<CadConverter />} />
          <Route path="ebook" element={<EbookConverter />} />
          <Route path="font" element={<FontConverter />} />
          <Route path="presentation" element={<PresentationConverter />} />
          <Route path="spreadsheet" element={<SpreadsheetConverter />} />
          <Route path="vector" element={<VectorConverter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

