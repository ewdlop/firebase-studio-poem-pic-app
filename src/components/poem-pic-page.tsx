
"use client";

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generatePoemFromImage, type GeneratePoemFromImageInput, type GeneratePoemFromImageOutput } from '@/ai/flows/generate-poem-from-image';
import { Loader2, UploadCloud, Copy, Sparkles, FileImage, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function PoemPicPage() {
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generatedPoem, setGeneratedPoem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showImage, setShowImage] = useState<boolean>(false);
  const [showPoem, setShowPoem] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (uploadedImageSrc) {
      setShowImage(true);
    } else {
      setShowImage(false);
    }
  }, [uploadedImageSrc]);

  useEffect(() => {
    if (generatedPoem) {
      setShowPoem(true);
    } else {
      setShowPoem(false);
    }
  }, [generatedPoem]);


  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError(`Invalid file type. Please upload an image (selected: ${file.type}).`);
        toast({ title: "Upload Error", description: "Please upload an image file.", variant: "destructive" });
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        toast({ title: "Upload Error", description: `File too large (max ${MAX_FILE_SIZE_MB}MB).`, variant: "destructive" });
        return;
      }

      setError(null);
      setGeneratedPoem(null);
      setShowPoem(false);
      setImageFile(file);
      try {
        const dataUri = await fileToDataUri(file);
        setUploadedImageSrc(dataUri);
      } catch (err) {
        setError("Failed to read image file.");
        toast({ title: "Upload Error", description: "Could not read the image file.", variant: "destructive" });
        console.error(err);
      }
    }
  };

  const handleGeneratePoem = async () => {
    if (!uploadedImageSrc || !imageFile) {
      setError("Please upload an image first.");
      toast({ title: "Error", description: "Please upload an image first.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPoem(null); // Clear previous poem
    setShowPoem(false);

    try {
      const input: GeneratePoemFromImageInput = { photoDataUri: uploadedImageSrc };
      const result: GeneratePoemFromImageOutput = await generatePoemFromImage(input);
      setGeneratedPoem(result.poem);
    } catch (err) {
      console.error("AI Poem Generation Error:", err);
      let errorMessage = "Failed to generate poem. Please try again.";
      if (err instanceof Error) {
        errorMessage = `Error: ${err.message}. Please try again.`;
      }
      setError(errorMessage);
      toast({ title: "Generation Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPoem = () => {
    if (generatedPoem) {
      navigator.clipboard.writeText(generatedPoem)
        .then(() => {
          toast({ title: "Success!", description: "Poem copied to clipboard." });
        })
        .catch(err => {
          console.error("Copy Error:", err);
          toast({ title: "Copy Error", description: "Could not copy poem.", variant: "destructive" });
        });
    }
  };

  const handleClearImage = () => {
    setUploadedImageSrc(null);
    setImageFile(null);
    setGeneratedPoem(null);
    setError(null);
    setShowImage(false);
    setShowPoem(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center min-h-screen">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold font-serif text-primary tracking-tight">PoemPic</h1>
        <p className="text-xl text-muted-foreground mt-2">Transform your photos into poetry.</p>
      </header>

      <Card className="w-full max-w-3xl shadow-xl bg-card rounded-xl overflow-hidden">
        <CardContent className="p-6 md:p-10">
          <div className="space-y-8">
            {/* Image Upload Section */}
            {!uploadedImageSrc && (
              <div className="flex flex-col items-center space-y-4 p-8 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors duration-300 cursor-pointer" onClick={triggerFileInput}>
                <UploadCloud className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-lg font-medium text-foreground">Click or drag to upload a photo</p>
                <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to {MAX_FILE_SIZE_MB}MB</p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-label="Upload photo"
                />
              </div>
            )}
            
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-md text-sm flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Image Preview and Poem Generation Section */}
            {uploadedImageSrc && (
              <div className={cn(
                "grid md:grid-cols-2 gap-6 md:gap-8 items-start opacity-0",
                showImage && "animate-fade-in"
              )}>
                <div className="space-y-4">
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-border shadow-md">
                    <Image
                      src={uploadedImageSrc}
                      alt="Uploaded photo"
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint="uploaded photo"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleGeneratePoem} disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {isLoading ? 'Generating...' : 'Generate Poem'}
                    </Button>
                     <Button onClick={handleClearImage} variant="outline" className="w-full">
                      <FileImage className="mr-2 h-4 w-4" />
                      Change Photo
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {isLoading && (
                     <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg p-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Crafting your poem...</p>
                        <p className="text-sm text-muted-foreground">This might take a moment.</p>
                    </div>
                  )}
                  {!isLoading && generatedPoem && (
                    <div className={cn(
                      "space-y-4 opacity-0",
                      showPoem && "animate-fade-in animation-delay-500" // Staggered fade-in
                    )}>
                      <h3 className="text-2xl font-semibold font-serif text-primary">Your Poem:</h3>
                      <Textarea
                        readOnly
                        value={generatedPoem}
                        className="min-h-[200px] text-base bg-background/50 border-border p-4 rounded-md shadow-inner"
                        aria-label="Generated poem"
                      />
                      <Button onClick={handleCopyPoem} variant="secondary" className="w-full">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Poem
                      </Button>
                    </div>
                  )}
                  {!isLoading && !generatedPoem && !error && (
                     <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg p-4 bg-muted/20">
                        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">Your poem will appear here once generated.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PoemPic. All rights reserved.</p>
      </footer>
    </div>
  );
}
