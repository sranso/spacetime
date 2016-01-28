/* test-xorgens.c 

   A simple test program for xorgens version 3.04.
   Thanks to K. M. Briggs for assistance in making this portable.
   
   Needs xorgens.h, xorgens.c
   
   R. P. Brent, 20060628
   ===================================================================
   Compilation hints:
   
   On some machines (e.g. Sun Ultrasparc) can compile 
   in 32-bit integer mode with:
     gcc -O4 -o test-xorgens -lm test-xorgens.c 
   or 64-bit integer mode with: 
     cc -Ofast -xtarget=ultra -xarch=v9 -lm -o test-xorgens test-xorgens.c

   On other machines (e.g. AMD Opteron) 64-bit mode is the default:
     gcc -O4 -o test-xorgens -lm test-xorgens.c
   but if you really want 32-bit integers you can get them by changing 
   the definition of UINT in xorgens.h

   With Fedora core 4 on AMD64, and Fedora core 5 on Pentiums:
     gcc -O3 -Wall test-xorgens.c -o test-xorgens -lm
*/

#include <stdio.h>
#include <math.h>

#include "xorgens.h"
#include "xorgens.c"

const int bins=64;
const int trials=10000000;
const int seed0=1;
const UINT mult=1751468273; /* random odd number */

int main() {
  UINT i, x, n=trials, seed=seed0, h[bins];
  double sum, e, xerr;
  printf("sizeof(UINT)  = %d (should be 4 or 8)\n", (int)sizeof(UINT));
  printf("%d trials and %d bins with seed %ld\n",(int)n,(int)bins,(long)seed);
  for (i=0; i<bins; i++) h[i]=0;
  x = xor4096i(seed);
  printf("1st random number %x\n",x);
  x = xor4096i(0);
  printf("2nd random number %x\n",x);
  x = xor4096i(0);
  printf("3rd random number %x\n",x);
  x = xor4096i(0);
  printf("4th random number %x\n",x);
  x = xor4096i(0);
  printf("5th random number %x\n",x);
  for (i=0; i<n; i++) {
    h[(mult * xor4096i(0)) >> 26]++;  /* 26 == 32 - 6; 6 bits in 64 */
  }
  for (i=0; i<bins; i++) printf("%3d %d\n",(int)i,(int)h[i]);
  e = (double)n/(double)bins;     /* Expected number per bin */
  for (i=0, sum=0; i<bins; i++)   /* Compute chi-squared statistic */
    sum += ((double)h[i] - e)*((double)h[i] - e);
  sum = sum/e;
  printf ("Chi-squared_%d %g\n", bins-1, sum);
  xerr = sqrt(2.0*sum) - sqrt(2.0*(bins-1)-1.0);
  /* If bins is not too small then xerr should have normal distribution */
  printf ("Following should be roughly N(0,1): %g\n", xerr); 
  return 0;
}
