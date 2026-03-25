---
title:
  zh: Spark 性能调优
  en: Spark Performance Tuning
date: 2024-01-20
category: qi
subcategory: big-data
tags: [spark, 大数据, 性能优化]
description:
  zh: 深入了解 Apache Spark 的性能调优技巧，提升大数据处理效率。
  en: Deep dive into Apache Spark performance tuning techniques to improve big data processing efficiency.
author: shaynewq
draft: false
---

# Spark 性能调优

Apache Spark 是一个快速、通用的大数据处理引擎。合理的性能调优可以显著提升作业执行效率。

## 内存管理优化

### 调整内存配置

```scala
// SparkConf 内存配置
val conf = new SparkConf()
  .set("spark.executor.memory", "8g")
  .set("spark.driver.memory", "4g")
  .set("spark.memory.fraction", "0.6")
  .set("spark.memory.storageFraction", "0.5")

// OR 环境变量配置
# spark.executor.memory=8g
# spark.driver.memory=4g
```

### 内存分配策略

```scala
// 动态分配
conf.set("spark.dynamicAllocation.enabled", "true")
  .set("spark.dynamicAllocation.maxExecutors", "20")
  .set("spark.dynamicAllocation.minExecutors", "2")
  .set("spark.dynamicAllocation.initialExecutors", "5")
```

## 并行度优化

### 设置合适的并行度

```scala
// 调整分区数
val rdd = sc.parallelize(data, 100) // 100 个分区

// 设置默认并行度
conf.set("spark.default.parallelism", "200")
conf.set("spark.sql.shuffle.partitions", "200")

// 重新分区
val repartitioned = df.repartition(200, $"column_name")
```

### 本地性优化

```scala
// 启用本地性调度
conf.set("spark.locality.wait", "3s")
  .set("spark.locality.wait.node", "0s")
  .set("spark.locality.wait.rack", "0s")

// 预分配数据
val cached = rdd.persist(StorageLevel.MEMORY_AND_DISK)
```

## SQL 性能优化

### 使用 Catalyst 优化器

```scala
// 启用自适应查询执行
conf.set("spark.sql.adaptive.enabled", "true")
  .set("spark.sql.adaptive.coalescePartitions.enabled", "true")
  .set("spark.sql.adaptive.skewJoin.enabled", "true")

// 使用 DataFrame/Dataset API
val df = spark.read.parquet("data.parquet")
val result = df.filter($"age" > 18)
  .groupBy("city")
  .agg(avg("salary").as("avg_salary"))
```

### 缓存策略

```scala
// 缓存常用表
df.createOrReplaceTempView("users")
spark.catalog.cacheTable("users")

// 缓存策略
df.cache() // MEMORY_ONLY
df.persist(StorageLevel.MEMORY_AND_DISK)
df.persist(StorageLevel.DISK_ONLY)
```

## shuffle 优化

### 减少 shuffle

```scala
// 使用 broadcast join
from pyspark.sql.functions import broadcast
result = df1.join(broadcast(df2), "id")

// 避免 groupByKey
rdd.reduceByKey(_ + _)  // 好于
rdd.groupByKey().mapValues(_.sum)
```

### Shuffle 配置

```scala
// 调整 shuffle 参数
conf.set("spark.shuffle.file.buffer", "64k")
  .set("spark.reducer.maxSizeInFlight", "64m")
  .set("spark.shuffle.sort.bypassMergeThreshold", "400")
```

## 数据格式优化

### 使用列式存储

```scala
// 写入 Parquet
df.write.parquet("output.parquet")

// 写入 ORC
df.write.orc("output.orc")

// 压缩选项
df.write
  .option("compression", "snappy")
  .parquet("output.parquet")
```

### 分区存储

```scala
// 按日期分区
df.write
  .partitionBy("year", "month", "day")
  .parquet("partitioned_data")

// 读取时过滤分区
spark.read.parquet("partitioned_data/year=2024/month=01")
```

## 监控和调试

### Spark UI 监控

```bash
# 访问 Spark UI
http://<driver-host>:4040

# 查看执行计划
df.explain()
df.explain(extended=true)
```

### 日志配置

```scala
// 设置日志级别
import org.apache.log4j.{Level, Logger}
Logger.getLogger("org.apache.spark").setLevel(Level.WARN)

// 性能日志
conf.set("spark.eventLog.enabled", "true")
  .set("spark.eventLog.dir", "hdfs:/logs/spark")
```

## 常见性能问题

### 数据倾斜解决方案

```scala
// 1. 增加分区数
val repartitioned = df.repartition(1000, $"skewed_key")

// 2. 使用 salt 技术
import org.apache.spark.sql.functions._
val salted = df.withColumn("salt", (rand() * 10).cast("int"))

// 3. 广播小表
val result = largeTable.join(broadcast(smallTable), "key")
```

### GC 调优

```scala
// 调整 GC 参数
conf.set("spark.executor.extraJavaOptions",
  "-XX:+UseG1GC " +
  "-XX:InitiatingHeapOccupancyPercent=45 " +
  "-XX:MaxGCPauseMillis=200")
```
