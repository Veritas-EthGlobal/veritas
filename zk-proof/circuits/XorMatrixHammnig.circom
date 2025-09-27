pragma circom 2.1.3;

template Bool() {
    signal input in;
    signal output out;
    
    in * (in - 1) === 0;   // enforce boolean
    out <== in;
}

template XorBit() {
    signal input a;
    signal input b;
    signal output c;

    // XOR = a + b - 2ab
    c <== a + b - 2 * a * b;
    
    // Add boolean constraints for inputs
    a * (a - 1) === 0;     // enforce a is boolean
    b * (b - 1) === 0;     // enforce b is boolean
    
    // Output c is automatically boolean due to XOR operation on boolean inputs
}

template XorHamming(bits) {
    signal input a[bits];
    signal input b[bits];
    signal output sum;

    component xbit[bits];
    signal partial[bits+1];

    // initialize partial[0] = 0
    partial[0] <== 0;

    // XOR each bit and accumulate
    for (var i = 0; i < bits; i++) {
        xbit[i] = XorBit();
        xbit[i].a <== a[i];
        xbit[i].b <== b[i];

        partial[i+1] <== partial[i] + xbit[i].c;
    }

    // final result
    sum <== partial[bits];
}

template XorMatrixHamming(n, m, bits) {
    signal input A[n][bits];
    signal input B[m][bits];
    signal output OUT[n][m];

    component cell[n][m];

    for (var i = 0; i < n; i++) {
        for (var j = 0; j < m; j++) {
            cell[i][j] = XorHamming(bits);
            for (var k = 0; k < bits; k++) {
                cell[i][j].a[k] <== A[i][k];  // Fixed: lowercase 'a'
                cell[i][j].b[k] <== B[j][k];  // Fixed: lowercase 'b'
            }
            OUT[i][j] <== cell[i][j].sum;
        }
    }
}

// Example instantiation: n=3, m=2, 500-bit inputs
component main = XorMatrixHamming(3, 2, 500);