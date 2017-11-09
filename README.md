# Whitespace Tools

Tools to normalize end-of-line (EOL) & beginning-of-line (BOL) whitespace in text files.

## Installation

Install the tools with:

```
npm install whitespace-tools
```

This will install the `spacer` and `ender` tools. Or run the latest version directly from [npmjs.org](https://nodejs.org) with:

```
npx -p whitespace-tools spacer ...
npx -p whitespace-tools ender ...
```

## Ender

The `ender` tool will normalize line endings.  Run `ender --help` for a list of options.

Run with a file name or pipe a file into the tool to get information on current line endings:

```
ender src/mySourceFile.js
cat someTextFile.txt | ender
```

To convert a file, supply `--new-eol` as one of `cr`, `lf`, `crlf` or `auto`.  If no `-output-file` option is given, the file will go to STDOUT.

## Spacer

The `spacer` tool will normalize line beginnings, up to the first non-whitespace character.  Run `spacer --help` for options.

Run with a file name or pipe a file into the tool to get information on current line beginnings:

```
spacer src/mySourcFile.js
cat someTextFile.txt | spacer
```

You can supply the `--new-bol` argument with either `spaces`, `tabs` or `auto`.  If the file has existing tabs, supply the `--tab-size` argument indicating how many spaces a tab represents. If `tabs` is supplied as `--new-bol`, supply the `--round` flag if you wish extra spaces to be rounded down to a whole tab.  Without this flag, the outputted file will still be reported as having `mixed` BOL's if there are any odd spaces in the BOL's.

## About This project

I've implemented this project in C#, Ruby, Python and now Javascript as a way to learn new programming languages, and also because they are _really useful tools_!  A search across projects in GitHub will reveal just how many files have mixtures of tabs & spaces at line BOL's.  Line ending problems are a little rarer these days, but they do still occur from time-to-time.  

The project is written in ES6 Javascript and cross compiled using Babel.  It currently targets Node 8.  PR's welcome for any enhancements.
