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
import { DocumentViewer } from "@/pages/DocumentViewer";
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
          <Route path="image/:format" element={<ImageConverter />} />
          <Route path="image-converter" element={<ImageConverter />} />
          <Route path="image-converter/:format" element={<ImageConverter />} />
          
          <Route path="document" element={<DocumentConverter />} />
          <Route path="document-converter" element={<DocumentConverter />} />
          <Route path="document-converter/:format" element={<DocumentConverter />} />
          <Route path="document-viewer" element={<DocumentViewer />} />
          <Route path="pdf-viewer" element={<DocumentViewer />} />
          
          <Route path="video" element={<VideoConverter />} />
          <Route path="video-converter" element={<VideoConverter />} />
          <Route path="video-converter/:format" element={<VideoConverter />} />
          
          <Route path="archive" element={<ArchiveConverter />} />
          <Route path="archive-converter" element={<ArchiveConverter />} />
          <Route path="archive-converter/:format" element={<ArchiveConverter />} />
          
          <Route path="cad" element={<CadConverter />} />
          <Route path="cad-converter" element={<CadConverter />} />
          <Route path="cad-converter/:format" element={<CadConverter />} />
          
          <Route path="ebook" element={<EbookConverter />} />
          <Route path="ebook-converter" element={<EbookConverter />} />
          <Route path="ebook-converter/:format" element={<EbookConverter />} />
          
          <Route path="font" element={<FontConverter />} />
          <Route path="font-converter" element={<FontConverter />} />
          <Route path="font-converter/:format" element={<FontConverter />} />
          
          <Route path="presentation" element={<PresentationConverter />} />
          <Route path="presentation-converter" element={<PresentationConverter />} />
          <Route path="presentation-converter/:format" element={<PresentationConverter />} />
          
          <Route path="spreadsheet" element={<SpreadsheetConverter />} />
          <Route path="spreadsheet-converter" element={<SpreadsheetConverter />} />
          <Route path="spreadsheet-converter/:format" element={<SpreadsheetConverter />} />
          
          <Route path="vector" element={<VectorConverter />} />
          <Route path="vector-converter" element={<VectorConverter />} />
          <Route path="vector-converter/:format" element={<VectorConverter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

