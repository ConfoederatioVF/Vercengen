**Forse** is the DSL used by Vercengen for visual scripting, and comes in both a **nodes** form (for ve.NodeEditor) and a **blocks** form (for ve.ScriptManagerBlockly). It is fully compatible with base Javascript and corresponds to it 1:1.

<img src = "./autodoc/images/Forse_preview.png">

<div style = "text-align: center;"><i>A look at the NodeEditor with Forse enabled.</i></div>

Individual blocks and their categories are listed below. These are split into both Blockly and Node views.

### Blocks:

Since arguments of this type are mainly visual, they will not be documented. Forse blocks are documented top/down. Blocks are listed multiple times where blocks logically do the same thing, but are duplicated due to different logic flows or contexts.

**Logic** (6):
- If/do
- Comparison statement (=, !=, <, <=, >, >=)
- Comparison statement (and, or)
- Not
- Boolean (true, false)
- Null
- Ternary Statement

**Loops** (15):
- For loop
- While loop
- For try/catch loop
- For Each loop
- Switch Case
- Case
- Continue
- Break
- For loop (iteration)
- For Each in Array loop
- For Each key in Object loop
- Break/Continue in loop
- Throw
- Yield
- Yield

**Maths** (18):
- Number
- Blank
- Decrement/Increment
- Decrement/Increment
- Maths Operation
- Math.<key> Operation
- Acos/Asin/Atan/Cos/Sin/Tan
- Constants
- Number is in Set
- Change Number by n
- Round Number
- Indicator of List
- Modulo
- Clamp Number
- Random Integer
- Random Fraction

**Text** (12):
- String
- Create Text with Strings
- Concatenate Strings
- Length of String
- Is String Empty
- Find Match in String
- Get Character in String
- Get Substring in String
- To Lowercase/Uppercase
- Trim String
- Print String
- Prompt for String

**Lists** (10):
- Create List
- Index of List
- Create List with Items
- Length of List
- Is List Empty
- Find Match in List
- Get Element in String
- Set Element in String As
- Get Sub-List
- Split Text

**Maps** (9):
- Create Map
- Size of Map
- Is Map Empty
- Map Key As Value
- Set Property Value
- Get Property
- Get Value in Map
- Set Value in Map
- Get Keys of Map

**Colour** (4):
- Colour
- Random Colour
- Colour (RGB)
- Blend Colours

**Variables** (6):
- Set Variable
- Is Variable
- Compare Variables
- Compare Variables
- Field
- Is Field

**Functions** (8):
- Declare Function
- Declare Function
- Call Function
- Call Function
- IIFE
- IIFE
- Return
- Destructure

**Class** (6):
- New
- Class Extends
- Class Extends
- Static
- Get
- Set

**Other** (6):
- Try/Catch/Finally
- Catch
- Export
- Import From
- Expression As Expression
- Comment

### Nodes:

**Custom Nodes** (6):
- Config: Node Category, Node Name, Node Output Type, Comment
- Parameters: Input (Parameter), Output (Return)

**Default Nodes** (81):
- **Booleans**: Is Equal, Is Strictly Equal, Is Not Equal, Is Not Strictly Equal, Greater or Equal Than, Greater Than, Less Than or Equal, To Less Than, If Then, False, True, Null, Undefined, AND, NOT, OR, XOR
- **Functions**: Call Function, Call Function (Preview), Call Method, Call Method (Preview), Get Class Field, Set Class Field, (Log) ERROR, (Log) INFO, (Log) WARN, Run Script
- **Loops**: For Loop, Get Obj.Iter. Key, Get Obj.Iter. Value, Iterate over Object, Set Timeout
- **Variables**: Set Any, Set String Array, Set Number Array, Set Boolean, Set Number, Set String, Set Array, Set Null, Set Object, Get Any, Get String Array, Get Number Array, Get Boolean, Get Number, Get String, Get Array, Get Null, Get Object, Get Global 
  - __Variables (Casting)__: Convert to Any, Convert to Array, Convert to String Array, Convert to Number Array, Convert to Boolean, Convert to Number, Convert to Script, Convert to String
  - __Variables (Expressions)__: Array Concat, Array Indexof, Array Length, Array Pop, Array Push, Array Reverse, Array Shift, Array Splice, Array Unshift, Join Array, Split String, Merge Objects, Get Object Keys, Get Object Values, Add Numbers, Exponentiate Numbers, Modulo, Multiply Numbers, Divide Numbers, Subtract Numbers, Add Strings, Ends With, Matches, Replace, Replace All, String Length, Starts With