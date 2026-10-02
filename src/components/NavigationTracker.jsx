import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const MAX = 60;
/** @type {string[]} */
let stack = [];

/** True when React Router history can move back one entry (no skip). */
export function canGoBackInApp() {
  const idx = window.history.state?.idx;
  if (typeof idx === 'number') return idx > 0;
  return stack.length > 1;
}

export function getNavStack() {
  return stack.slice();
}

export function peekPreviousPath() {
  return stack.length >= 2 ? stack[stack.length - 2] : null;
}

export function popNavStack() {
  if (stack.length) stack.pop();
  return stack[stack.length - 1] || null;
}

function record(key, navigationType) {
  if (!key) return;
  if (navigationType === 'REPLACE') {
    if (stack.length) stack[stack.length - 1] = key;
    else stack.push(key);
    return;
  }
  if (navigationType === 'POP') {
    const idx = stack.lastIndexOf(key);
    if (idx >= 0) stack = stack.slice(0, idx + 1);
    else stack.push(key);
    return;
  }
  if (stack[stack.length - 1] === key) return;
  stack.push(key);
  if (stack.length > MAX) stack = stack.slice(-MAX);
}

/** Keeps an in-app path stack so Back never skips pages. Mount once under the router. */
export default function NavigationTracker() {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const key = `${pathname}${search || ''}`;

  useEffect(() => {
    record(key, navigationType);
  }, [key, navigationType]);

  return null;
}
