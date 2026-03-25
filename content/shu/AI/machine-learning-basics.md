---
title:
  zh: 机器学习基础
  en: Machine Learning Fundamentals
date: 2024-02-03
category: shu
subcategory: AI
tags: [机器学习, ML, AI基础]
description:
  zh: 机器学习的核心概念和常用算法，帮助你入门人工智能领域。
  en: Core concepts and common algorithms in machine learning to help you get started with AI.
author: shaynewq
draft: false
---

# 机器学习基础

机器学习是人工智能的核心子领域，通过数据和算法让计算机从经验中学习。

## 学习类型

### 监督学习

```python
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# 生成分类数据
X, y = make_classification(
    n_samples=1000,
    n_features=20,
    n_classes=2,
    random_state=42
)

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 训练逻辑回归模型
model = LogisticRegression()
model.fit(X_train, y_train)

# 预测和评估
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.2%}")
```

### 无监督学习

```python
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# 数据标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# K-means 聚类
kmeans = KMeans(n_clusters=3, random_state=42)
clusters = kmeans.fit_predict(X_scaled)

# 可视化聚类结果
plt.figure(figsize=(10, 6))
plt.scatter(X_scaled[:, 0], X_scaled[:, 1], c=clusters, cmap='viridis')
plt.scatter(kmeans.cluster_centers_[:, 0],
            kmeans.cluster_centers_[:, 1],
            s=300, c='red', marker='x', label='Centroids')
plt.title('K-means 聚类结果')
plt.legend()
plt.show()
```

## 常用算法

### 决策树

```python
from sklearn.tree import DecisionTreeClassifier
from sklearn.tree import plot_tree
import matplotlib.pyplot as plt

# 创建决策树
dt_model = DecisionTreeClassifier(
    max_depth=5,
    min_samples_split=10,
    random_state=42
)

# 训练模型
dt_model.fit(X_train, y_train)

# 可视化树结构
plt.figure(figsize=(20, 10))
plot_tree(dt_model,
          feature_names=[f'feature_{i}' for i in range(20)],
          class_names=['Class 0', 'Class 1'],
          filled=True,
          rounded=True)
plt.show()
```

### 随机森林

```python
from sklearn.ensemble import RandomForestClassifier

# 创建随机森林
rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    random_state=42
)

# 训练模型
rf_model.fit(X_train, y_train)

# 特征重要性
feature_importance = zip(
    [f'feature_{i}' for i in range(20)],
    rf_model.feature_importances_
)

print("特征重要性:")
for feature, importance in feature_importance:
    print(f"{feature}: {importance:.3f}")
```

### 支持向量机

```python
from sklearn.svm import SVC

# 创建 SVM 分类器
svm_model = SVC(
    kernel='rbf',
    C=1.0,
    gamma='scale',
    random_state=42
)

# 训练模型
svm_model.fit(X_train, y_train)

# 预测
y_pred = svm_model.predict(X_test)
```

### 神经网络

```python
import torch
import torch.nn as nn
import torch.optim as optim

class NeuralNetwork(nn.Module):
    """简单神经网络"""

    def __init__(self, input_size, hidden_size, num_classes):
        super(NeuralNetwork, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_size, hidden_size // 2)
        self.fc3 = nn.Linear(hidden_size // 2, num_classes)
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.fc3(x)
        return x

# 创建模型
model = NeuralNetwork(input_size=20, hidden_size=64, num_classes=2)

# 定义损失函数和优化器
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr_rate=0.001)

# 训练循环
epochs = 50
for epoch in range(epochs):
    model.train()

    # 前向传播
    outputs = model(torch.FloatTensor(X_train))
    loss = criterion(outputs, torch.LongTensor(y_train))

    # 反向传播和优化
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    if (epoch + 1) % 10 == 0:
        print(f'Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}')
```

## 模型评估

### 分类指标

```python
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)

# 计算各种指标
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='macro')
recall = recall_score(y_test, y_pred, average='macro')
f1 = f1_score(y_test, y_pred, average='macro')

print(f"准确率: {accuracy:.2%}")
print(f"精确率: {precision:.2%}")
print(f"召回率: {recall:.2%}")
print(f"F1 分数: {f1:.2%}")

# 混淆矩阵
cm = confusion_matrix(y_test, y_pred)
print("\n混淆矩阵:")
print(cm)

# 详细分类报告
print("\n分类报告:")
print(classification_report(y_test, y_pred))
```

### 交叉验证

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold

# 创建 K 折交叉验证
kfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# 执行交叉验证
cv_scores = cross_val_score(model, X_train, y_train, cv=kfold, scoring='accuracy')

print(f"交叉验证准确率: {cv_scores.mean():.2%} (+/- {cv_scores.std() * 2:.2%})")
```

### 学习曲线

```python
from sklearn.model_selection import learning_curve
import matplotlib.pyplot as plt

train_sizes, train_scores, test_scores = learning_curve(
    model, X_train, y_train,
    train_sizes=[0.1, 0.3, 0.5, 0.7, 0.9, 1.0],
    cv=5,
    scoring='accuracy'
)

# 绘制学习曲线
plt.figure(figsize=(10, 6))
plt.plot(train_sizes, train_scores.mean(axis=1), 'o-', label='训练集')
plt.plot(train_sizes, test_scores.mean(axis=1), 'o-', label='验证集')
plt.xlabel('训练样本数')
plt.ylabel('准确率')
plt.title('学习曲线')
plt.legend()
plt.grid()
plt.show()
```

## 特征工程

### 特征选择

```python
from sklearn.feature_selection import SelectKBest, f_classif

# 选择最重要的 k 个特征
selector = SelectKBest(f_classif, k=10)
X_new = selector.fit_transform(X, y)

# 获取选中的特征
selected_features = selector.get_support(indices=True)
print(f"选中的特征索引: {selected_features}")
```

### 特征缩放

```python
from sklearn.preprocessing import StandardScaler, MinMaxScaler

# 标准化
scaler = StandardScaler()
X_standardized = scaler.fit_transform(X)

# 归一化
min_max_scaler = MinMaxScaler()
X_normalized = min_max_scaler.fit_transform(X)
```

## 超参数调优

### 网格搜索

```python
from sklearn.model_selection import GridSearchCV

# 定义参数网格
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, 15],
    'min_samples_split': [2, 5, 10]
}

# 创建随机森林
rf = RandomForestClassifier(random_state=42)

# 网格搜索
grid_search = GridSearchCV(
    rf, param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1
)

grid_search.fit(X_train, y_train)

print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳准确率: {grid_search.best_score_:.2%}")
```

### 随机搜索

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint, uniform

# 定义参数分布
param_distributions = {
    'n_estimators': randint(50, 200),
    'max_depth': randint(5, 20),
    'min_samples_split': randint(2, 11)
}

# 随机搜索
random_search = RandomizedSearchCV(
    rf, param_distributions,
    n_iter=100,
    cv=5,
    scoring='accuracy',
    random_state=42
)

random_search.fit(X_train, y_train)

print(f"最佳参数: {random_search.best_params_}")
print(f"最佳准确率: {random_search.best_score_:.2%}")
```

## 模型保存和加载

```python
import joblib

# 保存模型
joblib.dump(model, 'model.joblib')

# 加载模型
loaded_model = joblib.load('model.joblib')
```

## 最佳实践

1. **数据质量**: 确保数据干净、完整、平衡
2. **特征工程**: 投入时间提取有意义的特征
3. **模型选择**: 根据问题选择合适的算法
4. **交叉验证**: 使用交叉验证评估模型性能
5. **超参数调优**: 仔细调整模型参数
6. **防止过拟合**: 使用正则化、早停等技术
7. **模型解释**: 理解模型的决策过程
8. **持续监控**: 监控模型在生产环境中的表现
