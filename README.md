# Overview

**annotation-lookup-service** is a `Typescript`, `Express`, `Node`, and `Redis`-backed application that provides a partial REST API to do a direct lookup of annotations. 

This is a one-to-one, straight mapping of an annotation to its related metadata, such as genomic location. This does not provide the ability to query on annotation prefixes.

The Redis service must be configured with sufficient memory (`maxmemory`) to hold the annotation sets in memory. If sets are added beyond this capability, older annotations will be lost from memory.

<br>
<br>

---

## Prerequisites

- [Node.js](https://nodejs.org) (`>= 12.0.0`)
- [Yarn](https://yarnpkg.com/en/docs/install) or [NPM](https://docs.npmjs.com/getting-started/installing-node)

<br>
<br>

## Install

- Install the dependencies with [yarn](https://yarnpkg.com/getting-started/usage) or [npm](https://docs.npmjs.com/cli/v7/commands/npm-install).

<br>
<br>

## Local Development

Run the server locally. It will be run with Nodemon and ready to serve on port `8080` (unless you specify it on your `.env`)

```bash
 yarn start # or npm start
```

Services are available via http://localhost:8080.

<br>
<br>

## Production

First, build the application.

```bash
 yarn build # or npm run build
```

Then, use [`pm2`](https://github.com/Unitech/pm2) to start the application as a service.

```bash
 yarn service:start # or npm run service:start
```

<br>
<br>

## Services

Annotations are structured in the following way: `Project` > `Set` > `Annotation`.

There is one collection of projects at the top-most level. 

This default `Project` contains one or more `Set` collections containing genomic annotations. An example of a `Set` would be the current set of Index DHS annotations. Another example might be dbSNP variants. (Note: Multiple sets may be hosted from the same service instance, but the Redis database must be configured with sufficient memory to hold all keys.)

Each `Set` entry has metadata associated with it, such as `type`, `assembly`, `sourceUrl`, and `description`. These can be retrieved for descriptive purposes.

Each `Set` can be of type `BED4`, `BED4+`, `BED6`, or `DHS`, depending on the input type. The type specifies how many columns are stored from the input file.

Within a `Set` is a collection of one or more `Annotation` entries.

Each `Annotation` must have four or more columns of data. The input file specifying annotations must be minimally BED4. The input file does not need any particular sort order. 

### API

#### Sets

To list all sets, use `/sets`, e.g.:

```
// http://localhost:8080/sets

{
  "description": "Available sets for projects",
  "sets": [
    "set:Index_DHS"
  ]
}
```

Note that the set name is stored as `set:<foo>`, but the set identifier is just `foo`.

To get properties of a set, use `/sets?set=<foo>`, e.g.:

```
// http://localhost:8080/sets?set=Index_DHS

{
  "description": "Properties associated with set [set:Index_DHS]",
  "data": {
    "type": "BED4",
    "timestamp": "2022-04-28T20:25:18.929Z",
    "description": "DHS_Index_and_Vocabulary_hg38_WM20190703",
    "assembly": "hg38"
  }
}
```

To add a set, use a `POST` request to `/sets`, e.g. first download the Index DHS file:

```
$ wget -qO- http://www.meuleman.org/DHS_Index_and_Vocabulary_hg38_WM20190703.txt.gz \
    | gunzip -c \
    | tail -n+2 \
    | sort-bed - \
    > /Users/areynolds/Downloads/DHS_Index_and_Vocabulary_hg38_WM20190703.bed
```

Then `POST` it, with useful metadata:

```
$ curl -F "name=Index_DHS" \
       -F "type=BED4" \
       -F "sourceUrl=http://www.meuleman.org/DHS_Index_and_Vocabulary_hg38_WM20190703.txt.gz" \
       -F "description=DHS_Index_and_Vocabulary_hg38_WM20190703" \
       -F "assembly=hg38" \
       -F "file=@/Users/areynolds/Downloads/DHS_Index_and_Vocabulary_hg38_WM20190703.bed" \
       -X POST http://localhost:8080/sets
```

This can take a few minutes. Upon completion, the response will be a JSON object containing metadata about the set, along with the number of records added.

#### Annotation

Once a set is added, it can be queried for an annotation that matches the identifier from the input file's fourth column, via `/annotation?identifier=<identifier>&set=<set>` and (optionally) `/annotation?identifier=<identifier>&set=<set>&feature=<feature>`, e.g.:

```
// http://localhost:8080/annotation?identifier=X.217776&set=Index_DHS

{
  "description": "All data associated with identifier [Index_DHS:X.217776]",
  "data": {
    "seqname": "chrX",
    "start": 20412934,
    "end": 20413140
  }
}
```

By default, all data associated with the annotation are returned. If the feature type `interval` is specified, only the genomic interval is returned. (Note: For BED4 datasets, the response will be identical whether the feature is or is not specified.)