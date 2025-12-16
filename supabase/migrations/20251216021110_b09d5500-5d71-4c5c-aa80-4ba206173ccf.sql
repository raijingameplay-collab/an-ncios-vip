-- Allow advertisers to delete their own listings
CREATE POLICY "Advertisers can delete own listings"
ON public.listings
FOR DELETE
USING (advertiser_id = get_advertiser_id(auth.uid()));

-- Allow advertisers to delete their own listing photos
CREATE POLICY "Advertisers can delete own listing photos"
ON public.listing_photos
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM listings
  WHERE listings.id = listing_photos.listing_id
  AND listings.advertiser_id = get_advertiser_id(auth.uid())
));