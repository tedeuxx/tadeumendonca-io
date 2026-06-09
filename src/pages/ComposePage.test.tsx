import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { useCreatePost } = vi.hoisted(() => ({ useCreatePost: vi.fn() }));
vi.mock('../hooks/usePostMutations', () => ({ useCreatePost }));

import { ComposePage } from './ComposePage';

// Target the native control by placeholder (Cloudscape derives detail.value from the native value).
const setByPlaceholder = (placeholder: string, value: string) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

beforeEach(() => vi.clearAllMocks());

describe('ComposePage', () => {
  it('validates required title + body before submitting', () => {
    const mutate = vi.fn();
    useCreatePost.mockReturnValue({ mutate, isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposePage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('submits a parsed post (tags split, published flag)', () => {
    const mutate = vi.fn();
    useCreatePost.mockReturnValue({ mutate, isPending: false, isError: false });
    render(
      <MemoryRouter>
        <ComposePage />
      </MemoryRouter>,
    );
    setByPlaceholder('Post title', 'My Post');
    setByPlaceholder('Write your post…', 'Hello body');
    setByPlaceholder('serverless, aws', 'aws, serverless');
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(mutate).toHaveBeenCalled();
    expect(mutate.mock.calls[0][0]).toMatchObject({ title: 'My Post', body: 'Hello body', tags: ['aws', 'serverless'], published: false });
  });
});
