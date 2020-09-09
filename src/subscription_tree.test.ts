import {SubscriptionTreeNode} from './subscription_tree';

const data = {
  parent: {
    child: 'value'
  }
};
const _getValueAt = (_path: string[], path = [..._path]) => {
  let node = data;
  while (path.length) {
    const nodeName = path.shift()!;
    if (node.hasOwnProperty(nodeName)) {
      // @ts-ignore
      node = node[nodeName];
    } else {
      return undefined;
    }
  }
  return node;
};

describe('SubscriptionTreeNode', () => {
  it('takes subscriptions', () => {
    const getValueAt = jest.fn(_getValueAt);
    const tree = new SubscriptionTreeNode(getValueAt);
    const listener = jest.fn();
    tree.subscribe(listener);

    tree.notify();

    expect(getValueAt).toBeCalledTimes(1);
    expect(getValueAt).toBeCalledWith([]);

    expect(listener).toBeCalledTimes(1);
    expect(listener).toBeCalledWith(data);
  });

  it('notifies parent listeners', () => {
    const getValueAt = jest.fn(_getValueAt);

    const tree = new SubscriptionTreeNode(getValueAt);
    const child = new SubscriptionTreeNode(getValueAt);
    tree.setChild('parent', child);

    const listener = jest.fn();
    tree.subscribe(listener);

    child.notify();

    expect(getValueAt).toBeCalledTimes(1);
    expect(getValueAt).toBeCalledWith([]);

    expect(listener).toBeCalledTimes(1);
    expect(listener).toBeCalledWith(data);
  });

  it('notifies children listeners', () => {
    const getValueAt = jest.fn(_getValueAt);

    const tree = new SubscriptionTreeNode(getValueAt);
    const child = new SubscriptionTreeNode(getValueAt);
    tree.setChild('parent', child);

    const listener = jest.fn();
    child.subscribe(listener);

    tree.notify();

    expect(getValueAt).toBeCalledTimes(1);
    expect(getValueAt).toBeCalledWith(['parent']);

    expect(listener).toBeCalledTimes(1);
    expect(listener).toBeCalledWith(data.parent);
  });

  it('notifies everyone', () => {
    const getValueAt = jest.fn(_getValueAt);

    const tree = new SubscriptionTreeNode(getValueAt);
    const child1 = new SubscriptionTreeNode(getValueAt);
    const child2 = new SubscriptionTreeNode(getValueAt);
    tree.setChild('parent', child1);
    child1.setChild('child', child2);

    const treeListener = jest.fn();
    tree.subscribe(treeListener);

    const child1Listener = jest.fn();
    child1.subscribe(child1Listener);

    const child2Listener = jest.fn();
    child2.subscribe(child2Listener);

    child1.notify();

    expect(getValueAt).toBeCalledTimes(3);
    expect(getValueAt.mock.calls).toEqual([
      [[]],
      [['parent']],
      [['parent', 'child']]
    ]);

    expect(treeListener).toBeCalledTimes(1);
    expect(treeListener).toBeCalledWith(data);

    expect(child1Listener).toBeCalledTimes(1);
    expect(child1Listener).toBeCalledWith(data.parent);

    expect(child2Listener).toBeCalledTimes(1);
    expect(child2Listener).toBeCalledWith(data.parent.child);
  });
});