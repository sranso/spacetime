/* xorgens.h for xorgens version 3.04, R. P. Brent 20060628 */
#include <stdint.h>

typedef uint32_t UINT; /* Type for random 32 or 64-bit integer, 
                               e.g. unsigned long, unsigned long long,
                               uint64_t, unsigned int or uint32_t */
                                   
typedef float UREAL;       /* Type for random 32 or 64-bit real,
                               e.g. double or float */

UINT  xor4096i(UINT seed);  /* integer random number generator */

UREAL xor4096r(UINT seed);  /* real random number generator */
