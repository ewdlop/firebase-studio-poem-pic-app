'use server';
/**
 * @fileOverview Generates a poem based on the content of an image.
 *
 * - generatePoemFromImage - A function that handles the poem generation process.
 * - GeneratePoemFromImageInput - The input type for the generatePoemFromImage function.
 * - GeneratePoemFromImageOutput - The return type for the generatePoemFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePoemFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to generate a poem from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GeneratePoemFromImageInput = z.infer<typeof GeneratePoemFromImageInputSchema>;

const GeneratePoemFromImageOutputSchema = z.object({
  poem: z.string().describe('The generated poem based on the image.'),
});
export type GeneratePoemFromImageOutput = z.infer<typeof GeneratePoemFromImageOutputSchema>;

export async function generatePoemFromImage(
  input: GeneratePoemFromImageInput
): Promise<GeneratePoemFromImageOutput> {
  return generatePoemFromImageFlow(input);
}

const generatePoemPrompt = ai.definePrompt({
  name: 'generatePoemPrompt',
  input: {schema: GeneratePoemFromImageInputSchema},
  output: {schema: GeneratePoemFromImageOutputSchema},
  prompt: `You are a poet, skilled at writing poems based on images.

  Write a poem inspired by the following image. Choose the poem type and overall theme.

  Image: {{media url=photoDataUri}}
  `,
});

const generatePoemFromImageFlow = ai.defineFlow(
  {
    name: 'generatePoemFromImageFlow',
    inputSchema: GeneratePoemFromImageInputSchema,
    outputSchema: GeneratePoemFromImageOutputSchema,
  },
  async input => {
    const {output} = await generatePoemPrompt(input);
    return output!;
  }
);
