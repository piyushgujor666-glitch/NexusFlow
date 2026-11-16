import { Subject, filter, map, scan, tap } from 'rxjs';
import { validateGraph } from './graph.js';

const compare = (value, operator, limit) => {
 switch (operator) {
  case '>': return value > limit;
  case '>=': return value >= limit;
  case '<': return value < limit;
  case '<=': return value <= limit;
  default: return false;
 }
};

/** Compile a validated graph into independent RxJS subscriptions. */
export class RuleEngine {
 constructor(onAlert) {
  if (typeof onAlert !== 'function') throw new TypeError('onAlert callback required');
  this.stream = new Subject();
  this.subscriptions = [];
  this.onAlert = onAlert;
  this.closed = false;
 }
 deploy(graph) {
  if (this.closed) throw new Error('Rule engine is closed');
  // Validate first: a rejected deployment must preserve the current live rules.
  const { paths } = validateGraph(graph);
  const next = [];
  try {
   for (const path of paths) {
    const source = path[0];
    const ops = [
     filter(point => point?.metadata?.sensor === source.data.sensor),
     filter(point => typeof point.value === 'number' && Number.isFinite(point.value)),
     map(point => ({ ...point, current: point.value }))
    ];
    for (const node of path.slice(1)) {
     if (node.type === 'average') {
      const window = node.data.window;
      ops.push(
       scan((state, point) => {
        const values = [...state.values, point.current].slice(-window);
        return { values, point: { ...point, current: values.reduce((sum, value) => sum + value, 0) / values.length } };
       }, { values: [], point: null }),
       map(state => state.point)
      );
     } else if (node.type === 'threshold') {
      ops.push(filter(point => compare(point.current, node.data.operator, node.data.limit)));
     } else if (node.type === 'alert') {
      ops.push(tap(point => {
       const alert = {
        sensor: point.metadata.sensor, value: point.value,
        evaluatedValue: point.current,
        message: String(node.data?.message || 'Rule triggered').slice(0, 200),
        at: point.timestamp, nodeId: node.id
       };
       try {
        Promise.resolve(this.onAlert(alert)).catch(error => console.error('Alert callback failed:', error));
       } catch (error) {
        console.error('Alert callback failed:', error);
       }
      }));
     }
    }
    next.push(this.stream.pipe(...ops).subscribe({
     error: error => console.error('RxJS pipeline failed:', error)
    }));
   }
  } catch (error) {
   for (const subscription of next) subscription.unsubscribe();
   throw error;
  }
  for (const subscription of this.subscriptions) subscription.unsubscribe();
  this.subscriptions = next;
  return { deployedPaths: next.length };
 }
 ingest(point) {
  if (this.closed) throw new Error('Rule engine is closed');
  this.stream.next(point);
 }
 close() {
  if (this.closed) return;
  this.closed = true;
  for (const subscription of this.subscriptions) subscription.unsubscribe();
  this.subscriptions = [];
  this.stream.complete();
 }
}
