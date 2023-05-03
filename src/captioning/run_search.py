import argparse
from clip_reverse_image_search_coco import load_and_search_coco_captions

parser = argparse.ArgumentParser(description="Reverse image search using CLIP and MS COCO captions")
parser.add_argument("image", help="Path to the input image")
parser.add_argument("annotations", help="Path to the MS COCO captions JSON file")
parser.add_argument("--num_samples", type=int, default=10000, help="Number of MS COCO captions to sample (default: 10000)")
parser.add_argument("--num_results", type=int, default=5, help="Number of top results to return (default: 5)")
parser.add_argument("--batch_size", type=int, default=128, help="Batch size for processing (default: 128)")

args = parser.parse_args()

results = load_and_search_coco_captions(args.image, args.annotations, args.num_samples, args.num_results, args.batch_size)

for description, similarity in results:
    print(f"{description} (similarity: {similarity:.2f})")