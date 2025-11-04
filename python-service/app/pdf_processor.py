import io
import base64
from typing import Dict, Any, List
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
from PIL import Image
import logging

logger = logging.getLogger(__name__)


class PDFProcessor:
    """Process PDF files and extract text and images"""

    def process_pdf(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Process a PDF file and extract text and images

        Args:
            pdf_bytes: PDF file as bytes

        Returns:
            Dictionary containing extracted data
        """
        try:
            # Extract text
            text = self._extract_text(pdf_bytes)

            # Convert pages to images
            images = self._pdf_to_images(pdf_bytes)

            # Get metadata
            metadata = self._extract_metadata(pdf_bytes)

            return {
                "text": text,
                "images": images,
                "num_pages": metadata.get("num_pages", 0),
                "metadata": metadata
            }

        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}", exc_info=True)
            raise

    def _extract_text(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF"""
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            reader = PdfReader(pdf_file)

            text_parts = []
            for page in reader.pages:
                text_parts.append(page.extract_text())

            return "\n\n".join(text_parts)

        except Exception as e:
            logger.error(f"Error extracting text: {str(e)}")
            return ""

    def _pdf_to_images(self, pdf_bytes: bytes, max_pages: int = 5) -> List[str]:
        """
        Convert PDF pages to base64 encoded images

        Args:
            pdf_bytes: PDF file as bytes
            max_pages: Maximum number of pages to convert

        Returns:
            List of base64 encoded images
        """
        try:
            # Convert PDF to images
            images = convert_from_bytes(
                pdf_bytes,
                dpi=200,
                fmt='jpeg',
                first_page=1,
                last_page=max_pages
            )

            base64_images = []
            for img in images:
                # Resize if too large
                max_size = (1024, 1024)
                img.thumbnail(max_size, Image.Resampling.LANCZOS)

                # Convert to base64
                buffered = io.BytesIO()
                img.save(buffered, format="JPEG", quality=85)
                img_base64 = base64.b64encode(buffered.getvalue()).decode()
                base64_images.append(img_base64)

            return base64_images

        except Exception as e:
            logger.error(f"Error converting PDF to images: {str(e)}")
            return []

    def _extract_metadata(self, pdf_bytes: bytes) -> Dict[str, Any]:
        """Extract metadata from PDF"""
        try:
            pdf_file = io.BytesIO(pdf_bytes)
            reader = PdfReader(pdf_file)

            metadata = {
                "num_pages": len(reader.pages),
            }

            if reader.metadata:
                metadata.update({
                    "title": reader.metadata.get("/Title", ""),
                    "author": reader.metadata.get("/Author", ""),
                    "subject": reader.metadata.get("/Subject", ""),
                    "creator": reader.metadata.get("/Creator", ""),
                })

            return metadata

        except Exception as e:
            logger.error(f"Error extracting metadata: {str(e)}")
            return {"num_pages": 0}
