jest.mock('@huggingface/transformers');

import '@fgv/ts-utils-jest';
import * as upstream from '@huggingface/transformers';
import {
  loadPipeline,
  classify,
  classifyAll,
  embed,
  type TextClassificationPipeline,
  type TextClassificationOutput,
  type FeatureExtractionPipeline,
  type Tensor,
  type AllTasks
} from '../../index';

// ─── loadPipeline ──────────────────────────────────────────────────────────────

describe('loadPipeline', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('returns Success wrapping the upstream pipeline on success', async () => {
    const mockPipeline = jest.fn() as unknown as AllTasks['text-classification'];
    jest.mocked(upstream.pipeline).mockResolvedValueOnce(mockPipeline);

    const result = await loadPipeline(
      'text-classification',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    );
    expect(result).toSucceedWith(mockPipeline);
  });

  test('passes task and model to the upstream pipeline factory', async () => {
    const mockPipeline = jest.fn() as unknown as AllTasks['text-classification'];
    jest.mocked(upstream.pipeline).mockResolvedValueOnce(mockPipeline);

    await loadPipeline('text-classification', 'some-model-id');
    expect(upstream.pipeline).toHaveBeenCalledWith('text-classification', 'some-model-id', undefined);
  });

  test('passes options through to the upstream pipeline factory', async () => {
    const mockPipeline = jest.fn() as unknown as AllTasks['text-classification'];
    jest.mocked(upstream.pipeline).mockResolvedValueOnce(mockPipeline);

    const opts = { device: 'cpu' } as Parameters<typeof upstream.pipeline>[2];
    await loadPipeline('text-classification', 'some-model-id', opts);
    expect(upstream.pipeline).toHaveBeenCalledWith('text-classification', 'some-model-id', opts);
  });

  test('returns Success when model is omitted', async () => {
    const mockPipeline = jest.fn() as unknown as AllTasks['feature-extraction'];
    jest.mocked(upstream.pipeline).mockResolvedValueOnce(mockPipeline);

    const result = await loadPipeline('feature-extraction');
    expect(result).toSucceed();
    expect(upstream.pipeline).toHaveBeenCalledWith('feature-extraction', undefined, undefined);
  });

  test('returns Failure capturing upstream error message on network failure', async () => {
    jest
      .mocked(upstream.pipeline)
      .mockRejectedValueOnce(new Error('Could not locate the model: model-not-found'));

    const result = await loadPipeline('text-classification', 'model-not-found');
    expect(result).toFailWith(/could not locate the model/i);
  });

  test('returns Failure capturing upstream error on ONNX init failure', async () => {
    jest.mocked(upstream.pipeline).mockRejectedValueOnce(new Error('Failed to initialize ONNX runtime'));

    const result = await loadPipeline('text-classification', 'some-model');
    expect(result).toFailWith(/failed to initialize onnx runtime/i);
  });
});

// ─── classify ─────────────────────────────────────────────────────────────────

describe('classify', () => {
  let mockClassifier: jest.MockedFunction<TextClassificationPipeline>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockClassifier = jest.fn() as unknown as jest.MockedFunction<TextClassificationPipeline>;
  });

  test('returns Success wrapping TextClassificationOutput on success', async () => {
    const mockOutput: TextClassificationOutput = [{ label: 'POSITIVE', score: 0.9998 }];
    mockClassifier.mockResolvedValueOnce(mockOutput);

    const result = await classify(mockClassifier, 'I love transformers!');
    expect(result).toSucceedWith(mockOutput);
  });

  test('passes text to the upstream classifier', async () => {
    const mockOutput: TextClassificationOutput = [{ label: 'NEGATIVE', score: 0.9997 }];
    mockClassifier.mockResolvedValueOnce(mockOutput);

    await classify(mockClassifier, 'I hate bugs');
    expect(mockClassifier).toHaveBeenCalledWith('I hate bugs', undefined);
  });

  test('passes options through to the upstream classifier', async () => {
    const mockOutput: TextClassificationOutput = [
      { label: 'POSITIVE', score: 0.9998 },
      { label: 'NEGATIVE', score: 0.0002 }
    ];
    mockClassifier.mockResolvedValueOnce(mockOutput);

    const opts = { top_k: null };
    await classify(mockClassifier, 'Hello world', opts);
    expect(mockClassifier).toHaveBeenCalledWith('Hello world', opts);
  });

  test('normalises flat array result correctly', async () => {
    const mockOutput: TextClassificationOutput = [
      { label: 'SAFE', score: 0.95 },
      { label: 'UNSAFE', score: 0.05 }
    ];
    mockClassifier.mockResolvedValueOnce(mockOutput);

    expect(await classify(mockClassifier, 'hello')).toSucceedWith(mockOutput);
  });

  test('normalises nested array result by flattening one level', async () => {
    // When upstream returns array-of-arrays (e.g. batch input path leaked through),
    // we flatten one level so consumers always receive a flat TextClassificationOutput.
    const inner: TextClassificationOutput = [{ label: 'POSITIVE', score: 0.9 }];
    mockClassifier.mockResolvedValueOnce([inner] as unknown as TextClassificationOutput);

    expect(await classify(mockClassifier, 'hello')).toSucceedAndSatisfy((output) => {
      expect(output).toEqual([{ label: 'POSITIVE', score: 0.9 }]);
    });
  });

  test('returns Failure capturing upstream error on inference failure', async () => {
    mockClassifier.mockRejectedValueOnce(new Error('Inference session error: out of memory'));

    const result = await classify(mockClassifier, 'some text');
    expect(result).toFailWith(/inference session error/i);
  });

  test('returns Failure capturing upstream tokenisation error', async () => {
    mockClassifier.mockRejectedValueOnce(new Error('Tokenisation failed: unexpected token'));

    const result = await classify(mockClassifier, 'bad input');
    expect(result).toFailWith(/tokenisation failed/i);
  });
});

// ─── classifyAll ──────────────────────────────────────────────────────────────

describe('classifyAll', () => {
  let mockClassifier: jest.MockedFunction<TextClassificationPipeline>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockClassifier = jest.fn() as unknown as jest.MockedFunction<TextClassificationPipeline>;
  });

  test('forces top_k: null on the underlying classify call', async () => {
    const mockOutput: TextClassificationOutput = [
      { label: 'POSITIVE', score: 0.9998 },
      { label: 'NEGATIVE', score: 0.0002 }
    ];
    mockClassifier.mockResolvedValueOnce(mockOutput);

    await classifyAll(mockClassifier, 'hello');
    expect(mockClassifier).toHaveBeenCalledWith('hello', { top_k: null });
  });

  test('overrides caller-supplied top_k with null', async () => {
    const mockOutput: TextClassificationOutput = [
      { label: 'POSITIVE', score: 0.9998 },
      { label: 'NEGATIVE', score: 0.0002 }
    ];
    mockClassifier.mockResolvedValueOnce(mockOutput);

    await classifyAll(mockClassifier, 'hello', { top_k: 1 });
    expect(mockClassifier).toHaveBeenCalledWith('hello', { top_k: null });
  });

  test('returns all labels on success', async () => {
    const mockOutput: TextClassificationOutput = [
      { label: 'POSITIVE', score: 0.9998 },
      { label: 'NEGATIVE', score: 0.0002 }
    ];
    mockClassifier.mockResolvedValueOnce(mockOutput);

    const result = await classifyAll(mockClassifier, 'I love transformers!');
    expect(result).toSucceedWith(mockOutput);
  });

  test('propagates upstream inference failure as Failure', async () => {
    mockClassifier.mockRejectedValueOnce(new Error('Inference session error: out of memory'));

    const result = await classifyAll(mockClassifier, 'some text');
    expect(result).toFailWith(/inference session error/i);
  });
});

// ─── embed ────────────────────────────────────────────────────────────────────

describe('embed', () => {
  let mockExtractor: jest.MockedFunction<FeatureExtractionPipeline>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockExtractor = jest.fn() as unknown as jest.MockedFunction<FeatureExtractionPipeline>;
  });

  test('returns Success wrapping the upstream Tensor on success', async () => {
    const mockTensor = {
      type: 'float32',
      data: new Float32Array([0.1, 0.2, 0.3]),
      dims: [1, 3]
    } as unknown as Tensor;
    mockExtractor.mockResolvedValueOnce(mockTensor);

    const result = await embed(mockExtractor, 'This is a test.');
    expect(result).toSucceedWith(mockTensor);
  });

  test('passes text to the upstream extractor', async () => {
    const mockTensor = { type: 'float32', data: new Float32Array([0.1]), dims: [1, 1] } as unknown as Tensor;
    mockExtractor.mockResolvedValueOnce(mockTensor);

    await embed(mockExtractor, 'hello world');
    expect(mockExtractor).toHaveBeenCalledWith('hello world', undefined);
  });

  test('passes string array to the upstream extractor', async () => {
    const mockTensor = {
      type: 'float32',
      data: new Float32Array([0.1, 0.2]),
      dims: [2, 1]
    } as unknown as Tensor;
    mockExtractor.mockResolvedValueOnce(mockTensor);

    await embed(mockExtractor, ['text one', 'text two']);
    expect(mockExtractor).toHaveBeenCalledWith(['text one', 'text two'], undefined);
  });

  test('passes options through to the upstream extractor', async () => {
    const mockTensor = { type: 'float32', data: new Float32Array([0.5]), dims: [1, 1] } as unknown as Tensor;
    mockExtractor.mockResolvedValueOnce(mockTensor);

    const opts = { pooling: 'mean' as const, normalize: true };
    await embed(mockExtractor, 'some text', opts);
    expect(mockExtractor).toHaveBeenCalledWith('some text', opts);
  });

  test('returns Failure capturing upstream inference error', async () => {
    mockExtractor.mockRejectedValueOnce(new Error('Inference session error: out of memory'));

    const result = await embed(mockExtractor, 'some text');
    expect(result).toFailWith(/inference session error/i);
  });

  test('returns Failure capturing upstream tokenisation error', async () => {
    mockExtractor.mockRejectedValueOnce(new Error('Tokenisation failed: input too long'));

    const result = await embed(mockExtractor, 'bad input');
    expect(result).toFailWith(/tokenisation failed/i);
  });
});
