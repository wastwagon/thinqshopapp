-- Allow admin to take a live consignment listing offline without rejecting the submission
ALTER TYPE "ConsignmentStatus" ADD VALUE IF NOT EXISTS 'delisted';
