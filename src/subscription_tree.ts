export class SubscriptionTreeNode {
  parent?: SubscriptionTreeNode;
  path: string[] = [];
  listeners: Set<Function> = new Set();
  children: { [key: string]: SubscriptionTreeNode } = {};

  constructor(public getValueAt: (path: string[]) => any) {}

  subscribe(listener: Function) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(walkUp = true, walkDown = true) {
    if (walkUp === true) {
      if (this.parent) {
        this.parent.notify(true, false);
      }
    }

    if (this.listeners.size > 0) {
      const getValueAt = this.getValueAt;
      const value = getValueAt(this.path);
      this.listeners.forEach(listener => listener(value));
    }

    if (walkDown === true) {
      const childKeys = Object.keys(this.children);
      for (let i = 0; i < childKeys.length; i++) {
        this.children[childKeys[i]].notify(false, true);
      }
    }
  }

  setChild(name: string, node: SubscriptionTreeNode) {
    node.parent = this;
    node.path = [...this.path, name];
    this.children[name] = node;
  }

  getNode(_path: string[], path = [..._path]) {
    let node: SubscriptionTreeNode = this;

    while (path.length) {
      const childName = path.shift()!;

      if (node.children.hasOwnProperty(childName) === false) {
        const child = new SubscriptionTreeNode(this.getValueAt);
        node.setChild(childName, child)
      }

      node = node.children[childName];
    }

    return node;
  }
}

export const SubscriptionTree = SubscriptionTreeNode;