import os
import random
from PIL import Image
import torch
import clip
from pycocotools.coco import COCO


def load_coco_captions(json_file, num_samples=None):
    coco = COCO(json_file)
    captions = []
    for ann in coco.anns.values():
        captions.append(ann['caption'])
    
    if num_samples is not None:
        captions = random.sample(captions, num_samples)

    return captions


def reverse_image_search(image_path, candidate_descriptions, num_results=5, batch_size=128):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess = clip.load("ViT-B/32", device=device)

    with open(image_path, 'rb') as f:
        img = Image.open(f).convert('RGB')
    image_input = preprocess(img).unsqueeze(0).to(device)
    image_features = model.encode_image(image_input)

    num_candidates = len(candidate_descriptions)
    num_batches = (num_candidates + batch_size - 1) // batch_size
    similarities = torch.empty(num_candidates, device=device)

    for i in range(num_batches):
        start_index = i * batch_size
        end_index = min((i + 1) * batch_size, num_candidates)
        batch_descriptions = candidate_descriptions[start_index:end_index]
        prompt_embeddings = model.encode_text(clip.tokenize(batch_descriptions).to(device))
        batch_similarities = torch.nn.CosineSimilarity(dim=-1)(prompt_embeddings, image_features)
        similarities[start_index:end_index] = batch_similarities

    top_indexes = torch.argsort(similarities, descending=True)[:num_results]
    top_similarities = similarities[top_indexes].tolist()
    top_descriptions = [candidate_descriptions[i] for i in top_indexes.tolist()]

    return list(zip(top_descriptions, top_similarities))


def load_and_search_coco_captions(image_path, json_file, num_samples=10000, num_results=5, batch_size=128):
    coco_captions = load_coco_captions(json_file, num_samples=num_samples)
    results = reverse_image_search(image_path, coco_captions, num_results=num_results, batch_size=batch_size)
    return results
