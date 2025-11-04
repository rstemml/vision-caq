"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  className?: string;
}

export function PDFViewer({ fileUrl, className }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("Error loading PDF:", error);
    setError("Fehler beim Laden des PDFs");
    setLoading(false);
  }, []);

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages);
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1.0);
  const fitToWidth = () => setScale(1.5);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* PDF Controls */}
        <div className="flex items-center justify-between gap-2 p-4 border-b bg-secondary/30">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={pageNumber <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium whitespace-nowrap">
              Seite {pageNumber} von {numPages || "?"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={pageNumber >= numPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut} disabled={loading}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium whitespace-nowrap">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn} disabled={loading}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetZoom}
              disabled={loading}
              className="hidden sm:flex"
            >
              100%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fitToWidth}
              disabled={loading}
              className="hidden sm:flex"
            >
              Anpassen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              disabled={loading}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* PDF Document */}
        <div
          className={`overflow-auto bg-gray-100 dark:bg-gray-900 ${
            isFullscreen ? "fixed inset-0 z-50 pt-16" : "h-[600px]"
          }`}
        >
          <div className="flex items-center justify-center min-h-full p-4">
            {loading && (
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">PDF wird geladen...</p>
              </div>
            )}

            {error && (
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-medium mb-2">{error}</p>
                <p className="text-sm text-muted-foreground">
                  Bitte überprüfen Sie die Datei und versuchen Sie es erneut
                </p>
              </div>
            )}

            {!error && (
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
                error=""
                className="shadow-lg"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="bg-white"
                />
              </Document>
            )}
          </div>
        </div>

        {/* Page info footer */}
        {!loading && !error && numPages > 1 && (
          <div className="p-2 border-t bg-secondary/30 text-center text-xs text-muted-foreground">
            {numPages} Seite{numPages !== 1 ? "n" : ""} gesamt
          </div>
        )}
      </CardContent>
    </Card>
  );
}
